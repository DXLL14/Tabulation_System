<?php
// get_candidates.php
require_once '../db/database.php';
header('Content-Type: application/json');

$eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;
$category = isset($_GET['category']) ? $_GET['category'] : null;
$criteriaId = isset($_GET['criteria_id']) ? intval($_GET['criteria_id']) : null;

if ($eventId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid event ID']);
    exit;
}

try {
    // Get round type if criteria is selected
    $roundType = 'regular';
    $topLimit = null;
    
    if ($criteriaId) {
        $stmt = $mysqli->prepare("SELECT round_type FROM criteria WHERE id = ?");
        $stmt->bind_param("i", $criteriaId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $roundType = $row['round_type'];
            
            // Determine how many candidates to return PER CATEGORY based on round type
            switch($roundType) {
                case 'top10':
                    $topLimit = 10; // 10 per category (10 male + 10 female = 20 total)
                    break;
                case 'top5':
                    $topLimit = 5; // 5 per category (5 male + 5 female = 10 total)
                    break;
                case 'top3':
                    $topLimit = 3; // 3 per category (3 male + 3 female = 6 total)
                    break;
                default:
                    $topLimit = null; // Regular shows all
            }
        }
        $stmt->close();
    }
    
    // Get qualified candidates based on round type
    $candidates = [];
    
    if ($roundType === 'regular') {
        // Regular round - show ALL candidates (with or without scores)
        $sql = "SELECT c.id, c.candidate_no, c.name, c.category, c.photo 
                FROM candidates c
                WHERE c.event_id = ?";
        
        if ($category && $category !== 'all') {
            $sql .= " AND c.category = ?";
            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param("is", $eventId, $category);
        } else {
            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param("i", $eventId);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $candidates[] = $row;
        }
        $stmt->close();
        
    } else {
        // Top rounds - find the immediate previous round that EXISTS with SCORES
        $previousRoundType = null;
        
        // Determine which IMMEDIATE previous round to check
        if ($roundType === 'top10') {
            $searchOrder = ['regular'];
        } elseif ($roundType === 'top5') {
            // Top 5 gets from Top 10 if exists, else from Regular
            $searchOrder = ['top10', 'regular'];
        } elseif ($roundType === 'top3') {
            // Top 3 gets from Top 5 if exists, else Top 10, else Regular
            $searchOrder = ['top5', 'top10', 'regular'];
        }
        
        // Find the IMMEDIATE previous round that EXISTS (has criteria) and HAS SCORES
        foreach ($searchOrder as $searchRound) {
            // Check if round has criteria
            $checkCriteriaStmt = $mysqli->prepare("
                SELECT COUNT(*) as cnt 
                FROM criteria 
                WHERE event_id = ? AND round_type = ?
            ");
            $checkCriteriaStmt->bind_param("is", $eventId, $searchRound);
            $checkCriteriaStmt->execute();
            $checkCriteriaResult = $checkCriteriaStmt->get_result();
            $checkCriteriaRow = $checkCriteriaResult->fetch_assoc();
            
            // If this round exists (has criteria), check if it has scores
            if ($checkCriteriaRow['cnt'] > 0) {
                $scoreCheckStmt = $mysqli->prepare("
                    SELECT COUNT(DISTINCT s.candidate_id) as score_cnt
                    FROM scores s
                    JOIN candidates c ON s.candidate_id = c.id
                    WHERE c.event_id = ? AND s.round_type = ?
                ");
                $scoreCheckStmt->bind_param("is", $eventId, $searchRound);
                $scoreCheckStmt->execute();
                $scoreCheckResult = $scoreCheckStmt->get_result();
                $scoreCheckRow = $scoreCheckResult->fetch_assoc();
                $scoreCheckStmt->close();
                
                if ($scoreCheckRow['score_cnt'] > 0) {
                    $previousRoundType = $searchRound;
                    $checkCriteriaStmt->close();
                    break;
                }
            }
            $checkCriteriaStmt->close();
        }
        
        // If no previous round exists with scores, return empty
        if (!$previousRoundType) {
            echo json_encode([]);
            $mysqli->close();
            exit;
        }
        
        // Get top N candidates PER CATEGORY from previous round
        // Based on RANKING (scores) from previous round
        
        if ($category && $category !== 'all') {
            // Specific category selected - get top N for that category only
            $candidates = getTopCandidatesByRanking($mysqli, $eventId, $previousRoundType, $category, $topLimit);
        } else {
            // "All" category selected - get top N for EACH category separately
            $categories = ['1', '2']; // 1 = Male, 2 = Female
            
            foreach ($categories as $cat) {
                $catCandidates = getTopCandidatesByRanking($mysqli, $eventId, $previousRoundType, $cat, $topLimit);
                $candidates = array_merge($candidates, $catCandidates);
            }
        }
    }
    
    echo json_encode($candidates);
    $mysqli->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Get top N candidates by ranking from previous round
 * Uses the SAME calculation as get_scores.php to ensure consistency
 */
function getTopCandidatesByRanking($mysqli, $eventId, $previousRoundType, $category, $topLimit) {
    $candidates = [];
    
    // Get all candidates from this category who have scores in the previous round
    $candidateList = [];
    
    $cand_sql = "SELECT DISTINCT c.id, c.candidate_no, c.name, c.category, c.photo
                 FROM candidates c
                 JOIN scores s ON c.id = s.candidate_id
                 WHERE c.event_id = ? 
                   AND c.category = ?
                   AND s.round_type = ?";
    
    $cand_stmt = $mysqli->prepare($cand_sql);
    $cand_stmt->bind_param("iss", $eventId, $category, $previousRoundType);
    $cand_stmt->execute();
    $cand_result = $cand_stmt->get_result();
    
    while ($row = $cand_result->fetch_assoc()) {
        $candidateList[] = $row;
    }
    $cand_stmt->close();
    
    // Calculate score for each candidate using the SAME logic as get_scores.php
    $candidateScores = [];
    
    foreach ($candidateList as $candidate) {
        $score = calculateCandidateTotalScore($mysqli, $candidate['id'], $eventId, $previousRoundType);
        
        if ($score !== null && $score > 0) {
            $candidateScores[] = [
                'candidate' => $candidate,
                'score' => $score
            ];
        }
    }
    
    // Sort by score DESC (highest first) then by candidate_no ASC
    usort($candidateScores, function($a, $b) {
        if ($b['score'] == $a['score']) {
            return $a['candidate']['candidate_no'] - $b['candidate']['candidate_no'];
        }
        return $b['score'] - $a['score'];
    });
    
    // Get top N candidates
    $topCandidates = array_slice($candidateScores, 0, $topLimit);
    
    // Return only candidate data (without scores)
    foreach ($topCandidates as $item) {
        $candidates[] = $item['candidate'];
    }
    
    return $candidates;
}

/**
 * Calculate total score for a candidate - SAME logic as get_scores.php
 */
function calculateCandidateTotalScore($mysqli, $candidateId, $eventId, $roundType) {
    // Get all criteria for this round
    $criteria_sql = "SELECT id, percentage, min_score, max_score 
                     FROM criteria 
                     WHERE event_id = ? AND round_type = ?";
    
    $criteria_stmt = $mysqli->prepare($criteria_sql);
    $criteria_stmt->bind_param("is", $eventId, $roundType);
    $criteria_stmt->execute();
    $criteria_result = $criteria_stmt->get_result();
    
    $criteriaList = [];
    while ($row = $criteria_result->fetch_assoc()) {
        $criteriaList[] = $row;
    }
    $criteria_stmt->close();
    
    if (empty($criteriaList)) {
        return null;
    }
    
    // Get active judges for this round
    $judge_sql = "SELECT DISTINCT s.judge_id 
                  FROM scores s
                  JOIN candidates c ON s.candidate_id = c.id
                  WHERE c.event_id = ? AND s.round_type = ?";
    
    $judge_stmt = $mysqli->prepare($judge_sql);
    $judge_stmt->bind_param("is", $eventId, $roundType);
    $judge_stmt->execute();
    $judge_result = $judge_stmt->get_result();
    
    $activeJudges = [];
    while ($row = $judge_result->fetch_assoc()) {
        $activeJudges[] = $row['judge_id'];
    }
    $judge_stmt->close();
    
    if (empty($activeJudges)) {
        return null;
    }
    
    $totalWeightedCriteriaScore = 0;
    $totalCriteriaPercentage = 0;
    
    // Calculate score for each criteria
    foreach ($criteriaList as $criterion) {
        $critId = $criterion['id'];
        $critPercentage = floatval($criterion['percentage']);
        
        // Check if has subcriteria
        $sub_check = $mysqli->prepare("SELECT COUNT(*) as cnt FROM sub_criteria WHERE criteria_id = ?");
        $sub_check->bind_param("i", $critId);
        $sub_check->execute();
        $sub_check_result = $sub_check->get_result();
        $hasSubcriteria = $sub_check_result->fetch_assoc()['cnt'] > 0;
        $sub_check->close();
        
        $judgeCriteriaScores = [];
        
        if ($hasSubcriteria) {
            // Process subcriteria
            foreach ($activeJudges as $judgeId) {
                $score_sql = "SELECT s.score, sc.percentage, sc.min_score, sc.max_score
                              FROM scores s
                              JOIN sub_criteria sc ON s.subcriteria_id = sc.id
                              WHERE s.candidate_id = ? 
                                AND s.criteria_id = ? 
                                AND s.judge_id = ?
                                AND s.round_type = ?";
                
                $score_stmt = $mysqli->prepare($score_sql);
                $score_stmt->bind_param("iiis", $candidateId, $critId, $judgeId, $roundType);
                $score_stmt->execute();
                $score_result = $score_stmt->get_result();
                
                if ($score_result->num_rows > 0) {
                    $totalWeightedSubcriteriaScore = 0;
                    $totalSubcriteriaPercentage = 0;
                    
                    while($scoreRow = $score_result->fetch_assoc()) {
                        $rawScore = floatval($scoreRow['score']);
                        $subcriteriaPercentage = floatval($scoreRow['percentage']);
                        $minScore = floatval($scoreRow['min_score']);
                        $maxScore = floatval($scoreRow['max_score']);
                        
                        $score = max($minScore, min($maxScore, $rawScore));
                        
                        $scoreRange = $maxScore - $minScore;
                        if ($scoreRange > 0) {
                            $normalizedScore = (($score - $minScore) / $scoreRange) * 100;
                        } else {
                            $normalizedScore = 0;
                        }
                        
                        $weightedScore = ($normalizedScore * $subcriteriaPercentage) / 100;
                        $totalWeightedSubcriteriaScore += $weightedScore;
                        $totalSubcriteriaPercentage += $subcriteriaPercentage;
                    }
                    
                    if ($totalSubcriteriaPercentage > 0) {
                        $judgeCriteriaScore = ($totalWeightedSubcriteriaScore / $totalSubcriteriaPercentage) * 100;
                        $judgeCriteriaScores[] = $judgeCriteriaScore;
                    }
                }
                
                $score_stmt->close();
            }
        } else {
            // Direct criteria scores
            foreach ($activeJudges as $judgeId) {
                $direct_score_sql = "SELECT s.score
                                    FROM scores s
                                    WHERE s.candidate_id = ? 
                                    AND s.criteria_id = ? 
                                    AND s.judge_id = ?
                                    AND s.subcriteria_id IS NULL
                                    AND s.round_type = ?";
                
                $direct_score_stmt = $mysqli->prepare($direct_score_sql);
                $direct_score_stmt->bind_param("iiis", $candidateId, $critId, $judgeId, $roundType);
                $direct_score_stmt->execute();
                $direct_score_result = $direct_score_stmt->get_result();
                
                if ($direct_score_result->num_rows > 0) {
                    $scoreRow = $direct_score_result->fetch_assoc();
                    $rawScore = floatval($scoreRow['score']);
                    
                    $minScore = floatval($criterion['min_score']);
                    $maxScore = floatval($criterion['max_score']);
                    
                    $score = max($minScore, min($maxScore, $rawScore));
                    
                    $scoreRange = $maxScore - $minScore;
                    if ($scoreRange > 0) {
                        $normalizedScore = (($score - $minScore) / $scoreRange) * 100;
                    } else {
                        $normalizedScore = 100;
                    }
                    
                    $judgeCriteriaScores[] = $normalizedScore;
                }
                
                $direct_score_stmt->close();
            }
        }
        
        // Calculate average score for this criteria from all judges
        if (!empty($judgeCriteriaScores)) {
            $criteriaAvgScore = array_sum($judgeCriteriaScores) / count($judgeCriteriaScores);
            $weightedCriteriaScore = ($criteriaAvgScore * $critPercentage) / 100;
            
            $totalWeightedCriteriaScore += $weightedCriteriaScore;
            $totalCriteriaPercentage += $critPercentage;
        }
    }
    
    // Calculate final score
    if ($totalCriteriaPercentage > 0) {
        $finalScore = ($totalWeightedCriteriaScore / $totalCriteriaPercentage) * 100;
        return $finalScore;
    }
    
    return null;
}
?>