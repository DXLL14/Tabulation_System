<?php
require_once '../db/database.php';
header('Content-Type: application/json');

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => "Connection failed: " . $e->getMessage()]));
}

// Get the action from the request
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_events':
        getEvents($conn);
        break;
    case 'get_criteria':
        getCriteria($conn);
        break;
    case 'get_subcriteria':
        getSubcriteria($conn);
        break;
    case 'get_scores':
        getScores($conn);
        break;
    case 'get_judges':
        getJudges($conn);
        break;
    case 'get_all_judges':
        getAllJudges($conn);
        break;
    case 'get_all_contestants':
        getAllContestants($conn);
        break;
    case 'get_current_contestant':
        getCurrentContestant($conn);
        break;
    default:
        echo json_encode(['error' => 'Invalid action specified']);
        break;
}

// Function to get events
function getEvents($conn) {
    try {
        $sql = "SELECT id, event_name FROM events ORDER BY event_name";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($events);
    } catch (PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get criteria for a specific event WITH ROUND TYPE
function getCriteria($conn) {
    $eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

    if ($eventId <= 0) {
        echo json_encode(['error' => 'Invalid event ID']);
        return;
    }

    try {
        $sql = "SELECT id, criteria_name, round_type 
                FROM criteria 
                WHERE event_id = :event_id 
                ORDER BY 
                    CASE round_type
                        WHEN 'regular' THEN 1
                        WHEN 'top10' THEN 2
                        WHEN 'top5' THEN 3
                        WHEN 'top3' THEN 4
                    END,
                    criteria_name";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
        $stmt->execute();
        $criteria = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format display name with round type
        $formatted = [];
        foreach ($criteria as $criterion) {
            $roundTypeLabel = '';
            switch($criterion['round_type']) {
                case 'regular':
                    $roundTypeLabel = 'Preliminary';
                    break;
                case 'top10':
                    $roundTypeLabel = 'Top 10';
                    break;
                case 'top5':
                    $roundTypeLabel = 'Top 5';
                    break;
                case 'top3':
                    $roundTypeLabel = 'Top 3';
                    break;
            }
            
            $formatted[] = [
                'id' => $criterion['id'],
                'criteria_name' => $criterion['criteria_name'],
                'round_type' => $criterion['round_type'],
                'display_name' => $criterion['criteria_name'] . ' - ' . $roundTypeLabel
            ];
        }
        
        echo json_encode($formatted);
    } catch (PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get subcriteria for a specific criteria
function getSubcriteria($conn) {
    $criteriaId = isset($_GET['criteria_id']) ? intval($_GET['criteria_id']) : 0;

    if ($criteriaId <= 0) {
        echo json_encode(['error' => 'Invalid criteria ID']);
        return;
    }

    try {
        $sql = "SELECT id, sub_criteria_name as subcriteria_name FROM sub_criteria WHERE criteria_id = :criteria_id ORDER BY id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':criteria_id', $criteriaId, PDO::PARAM_INT);
        $stmt->execute();
        $subcriteria = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($subcriteria);
    } catch (PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get scores for specific event and criteria
function getScores($conn) {
    $eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;
    $criteriaId = isset($_GET['criteria_id']) ? intval($_GET['criteria_id']) : 0;

    if ($eventId <= 0 || $criteriaId <= 0) {
        echo json_encode(['error' => 'Invalid parameters']);
        return;
    }

    try {
        $sql = "SELECT 
                    s.id, 
                    s.judge_id, 
                    s.candidate_id, 
                    s.criteria_id, 
                    s.subcriteria_id, 
                    s.score,
                    c.name as candidate_name,
                    c.candidate_no,
                    c.category,
                    c.photo
                FROM 
                    scores s
                JOIN 
                    candidates c ON s.candidate_id = c.id
                WHERE 
                    c.event_id = :event_id 
                    AND s.criteria_id = :criteria_id
                ORDER BY 
                    c.candidate_no, s.judge_id, s.subcriteria_id";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
        $stmt->bindParam(':criteria_id', $criteriaId, PDO::PARAM_INT);
        $stmt->execute();
        $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($scores);
    } catch (PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get judge names
function getJudges($conn) {
    $judgeIds = isset($_GET['ids']) ? $_GET['ids'] : '';

    if (empty($judgeIds)) {
        echo json_encode([]);
        return;
    }

    try {
        $ids = explode(',', $judgeIds);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        $sql = "SELECT id, username FROM users WHERE id IN ($placeholders) AND role = 'judge'";
        $stmt = $conn->prepare($sql);
        
        foreach ($ids as $index => $id) {
            $stmt->bindValue($index + 1, $id, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        $judges = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $result = [];
        foreach ($judges as $judge) {
            $result[$judge['id']] = $judge['username'];
        }
        
        echo json_encode($result);
    } catch (PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get ALL judges assigned to an event
function getAllJudges($conn) {
    $eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

    if ($eventId <= 0) {
        echo json_encode(['error' => 'Invalid event ID']);
        return;
    }

    try {
        $sql = "SELECT u.id, u.username 
                FROM users u
                JOIN event_judges ej ON u.id = ej.judge_id
                WHERE ej.event_id = :event_id AND u.role = 'judge'
                ORDER BY u.username";
        
        $alternativeSql = "SELECT id, username FROM users WHERE role = 'judge' ORDER BY username";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
        
        try {
            $stmt->execute();
            $judges = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $stmt = $conn->prepare($alternativeSql);
            $stmt->execute();
            $judges = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        $result = [];
        foreach ($judges as $judge) {
            $result[$judge['id']] = $judge['username'];
        }
        
        echo json_encode($result);
    } catch (PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get ALL contestants OR qualified contestants based on round type
function getAllContestants($conn) {
    $eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;
    $criteriaId = isset($_GET['criteria_id']) ? intval($_GET['criteria_id']) : 0;

    if ($eventId <= 0) {
        echo json_encode(['error' => 'Invalid event ID']);
        return;
    }

    try {
        // Get round type if criteria is provided
        $roundType = 'regular';
        $topLimit = null;
        
        if ($criteriaId > 0) {
            $stmt = $conn->prepare("SELECT round_type FROM criteria WHERE id = :criteria_id");
            $stmt->bindParam(':criteria_id', $criteriaId, PDO::PARAM_INT);
            $stmt->execute();
            $criteriaData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($criteriaData) {
                $roundType = $criteriaData['round_type'];
                
                switch($roundType) {
                    case 'top10':
                        $topLimit = 10;
                        break;
                    case 'top5':
                        $topLimit = 5;
                        break;
                    case 'top3':
                        $topLimit = 3;
                        break;
                }
            }
        }
        
        // If regular round, return all contestants
        if ($roundType === 'regular') {
            $sql = "SELECT 
                    id, 
                    name, 
                    candidate_no,
                    category,
                    CASE 
                        WHEN photo IS NULL OR photo = '' THEN NULL
                        WHEN photo LIKE 'http%' THEN photo
                        ELSE CONCAT('contestants/', photo) 
                    END as photo
                FROM 
                    candidates 
                WHERE 
                    event_id = :event_id 
                ORDER BY 
                    candidate_no";
            
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
            $stmt->execute();
            $contestants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($contestants);
            return;
        }
        
        // For top rounds, get qualified contestants PER CATEGORY
        $previousRoundType = null;
        
        if ($roundType === 'top10') {
            $searchOrder = ['regular'];
        } elseif ($roundType === 'top5') {
            $searchOrder = ['top10', 'regular'];
        } elseif ($roundType === 'top3') {
            $searchOrder = ['top5', 'top10', 'regular'];
        }
        
        // Find previous round with criteria
        foreach ($searchOrder as $searchRound) {
            $checkStmt = $conn->prepare("SELECT COUNT(*) as cnt FROM criteria WHERE event_id = :event_id AND round_type = :round_type");
            $checkStmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
            $checkStmt->bindParam(':round_type', $searchRound, PDO::PARAM_STR);
            $checkStmt->execute();
            $checkRow = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($checkRow['cnt'] > 0) {
                $previousRoundType = $searchRound;
                break;
            }
        }
        
        if (!$previousRoundType) {
            echo json_encode([]);
            return;
        }
        
        // Check if previous round has scores
        $checkScoresStmt = $conn->prepare("
            SELECT COUNT(DISTINCT s.candidate_id) as candidate_count
            FROM scores s
            JOIN criteria cr ON s.criteria_id = cr.id
            JOIN candidates c ON s.candidate_id = c.id
            WHERE c.event_id = :event_id AND cr.round_type = :round_type
        ");
        $checkScoresStmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
        $checkScoresStmt->bindParam(':round_type', $previousRoundType, PDO::PARAM_STR);
        $checkScoresStmt->execute();
        $checkScoresRow = $checkScoresStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($checkScoresRow['candidate_count'] == 0) {
            echo json_encode([]);
            return;
        }
        
        // Get top contestants PER CATEGORY
        $categories = ['1', '2']; // Male and Female
        $allQualifiedContestants = [];
        
        foreach ($categories as $cat) {
            $sql = "
                SELECT 
                    c.id,
                    c.candidate_no,
                    c.name,
                    c.category,
                    CASE 
                        WHEN c.photo IS NULL OR c.photo = '' THEN NULL
                        WHEN c.photo LIKE 'http%' THEN c.photo
                        ELSE CONCAT('contestants/', c.photo) 
                    END as photo,
                    AVG(
                        CASE 
                            WHEN sc.id IS NOT NULL THEN 
                                (s.score - sc.min_score) / NULLIF((sc.max_score - sc.min_score), 0) * 100
                            ELSE 
                                (s.score - cr.min_score) / NULLIF((cr.max_score - cr.min_score), 0) * 100
                        END
                    ) as avg_score
                FROM candidates c
                INNER JOIN scores s ON c.id = s.candidate_id
                INNER JOIN criteria cr ON s.criteria_id = cr.id
                LEFT JOIN sub_criteria sc ON s.subcriteria_id = sc.id
                WHERE c.event_id = :event_id 
                    AND cr.event_id = :event_id2
                    AND cr.round_type = :round_type
                    AND c.category = :category
                GROUP BY c.id, c.candidate_no, c.name, c.category, c.photo
                HAVING avg_score > 0
                ORDER BY avg_score DESC
                LIMIT :top_limit
            ";
            
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
            $stmt->bindParam(':event_id2', $eventId, PDO::PARAM_INT);
            $stmt->bindParam(':round_type', $previousRoundType, PDO::PARAM_STR);
            $stmt->bindParam(':category', $cat, PDO::PARAM_STR);
            $stmt->bindParam(':top_limit', $topLimit, PDO::PARAM_INT);
            $stmt->execute();
            
            $categoryContestants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($categoryContestants as $contestant) {
                $allQualifiedContestants[] = [
                    'id' => $contestant['id'],
                    'candidate_no' => $contestant['candidate_no'],
                    'name' => $contestant['name'],
                    'category' => $contestant['category'],
                    'photo' => $contestant['photo']
                ];
            }
        }
        
        // Sort by candidate number
        usort($allQualifiedContestants, function($a, $b) {
            return intval($a['candidate_no']) - intval($b['candidate_no']);
        });
        
        echo json_encode($allQualifiedContestants);
        
    } catch (PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Function to get the currently selected contestants from selected_data table
function getCurrentContestant($conn) {
    $eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

    if ($eventId <= 0) {
        echo json_encode(['candidate_ids' => []]);
        return;
    }

    try {
        $sql = "SELECT DISTINCT candidate_id 
                FROM selected_data 
                WHERE event_id = :event_id 
                AND candidate_id IS NOT NULL";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':event_id', $eventId, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $candidateIds = array_map(function($row) {
            return intval($row['candidate_id']);
        }, $results);
        
        echo json_encode(['candidate_ids' => $candidateIds]);
    } catch (PDOException $e) {
        error_log('Error in getCurrentContestant: ' . $e->getMessage());
        echo json_encode(['candidate_ids' => [], 'error' => $e->getMessage()]);
    }
}
?>