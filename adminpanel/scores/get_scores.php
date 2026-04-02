<?php
// get_scores.php
require_once '../../db/database.php';

header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
    $round_type = isset($_GET['round_type']) && $_GET['round_type'] !== '' ? $_GET['round_type'] : null;
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $criteria_id = isset($_GET['criteria_id']) && $_GET['criteria_id'] !== '' ? intval($_GET['criteria_id']) : null;
    $show_partial = isset($_GET['show_partial']) && $_GET['show_partial'] === 'true';
    
    if (!$event_id) {
        throw new Exception("Event ID is required");
    }
    
    if (!$round_type) {
        echo json_encode(array(
            "status" => "no_round_selected", 
            "message" => "Please select a round type to view scores"
        ));
        exit;
    }
    
    // ==== GET QUALIFIED CANDIDATES BASED ON ROUND TYPE ====
    $qualified_candidate_ids = [];
    
    if ($round_type === 'regular') {
        // Regular round - get all candidates
        $candidate_sql = "SELECT c.id FROM candidates c WHERE c.event_id = ?";
        
        if ($category && $category !== 'all' && $category !== '') {
            $candidate_sql .= " AND c.category = ?";
            $cand_stmt = $mysqli->prepare($candidate_sql);
            $cand_stmt->bind_param("is", $event_id, $category);
        } else {
            $cand_stmt = $mysqli->prepare($candidate_sql);
            $cand_stmt->bind_param("i", $event_id);
        }
        
        $cand_stmt->execute();
        $cand_result = $cand_stmt->get_result();
        
        while($row = $cand_result->fetch_assoc()) {
            $qualified_candidate_ids[] = $row['id'];
        }
        $cand_stmt->close();
        
    } else {
        // Top rounds - find the immediate previous round that exists
        $previousRoundType = null;
        $topLimit = null;
        
        // Determine search order and limit
        if ($round_type === 'top10') {
            $searchOrder = ['regular'];
            $topLimit = 10;
        } elseif ($round_type === 'top5') {
            $searchOrder = ['top10', 'regular'];
            $topLimit = 5;
        } elseif ($round_type === 'top3') {
            $searchOrder = ['top5', 'top10', 'regular'];
            $topLimit = 3;
        }
        
        // Find the first existing previous round
        foreach ($searchOrder as $searchRound) {
            $checkStmt = $mysqli->prepare("
                SELECT COUNT(*) as cnt 
                FROM criteria 
                WHERE event_id = ? AND round_type = ?
            ");
            $checkStmt->bind_param("is", $event_id, $searchRound);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            $checkRow = $checkResult->fetch_assoc();
            
            if ($checkRow['cnt'] > 0) {
                // Also check if there are actual scores for this round
                $scoreCheckStmt = $mysqli->prepare("
                    SELECT COUNT(DISTINCT s.candidate_id) as score_cnt
                    FROM scores s
                    JOIN candidates c ON s.candidate_id = c.id
                    WHERE c.event_id = ? AND s.round_type = ?
                ");
                $scoreCheckStmt->bind_param("is", $event_id, $searchRound);
                $scoreCheckStmt->execute();
                $scoreCheckResult = $scoreCheckStmt->get_result();
                $scoreCheckRow = $scoreCheckResult->fetch_assoc();
                $scoreCheckStmt->close();
                
                if ($scoreCheckRow['score_cnt'] > 0) {
                    $previousRoundType = $searchRound;
                    $checkStmt->close();
                    break;
                }
            }
            $checkStmt->close();
        }
        
        if (!$previousRoundType) {
            echo json_encode(array(
                "status" => "no_previous_round", 
                "message" => "No previous round found with scores for round type: " . $round_type
            ));
            exit;
        }
        
        // Get categories to process
        $categories_to_process = [];
        if ($category && $category !== 'all' && $category !== '') {
            $categories_to_process[] = $category;
        } else {
            $categories_to_process = ['1', '2']; // Male and Female
        }
        
        // Get top N from each category based on PREVIOUS round scores
        foreach ($categories_to_process as $cat) {
            $qualified_ids = getTopCandidatesByScore($mysqli, $event_id, $previousRoundType, $cat, $topLimit);
            $qualified_candidate_ids = array_merge($qualified_candidate_ids, $qualified_ids);
        }
    }
    
    // If no qualified candidates found, return error
    if (empty($qualified_candidate_ids)) {
        echo json_encode(array(
            "status" => "no_qualified_candidates", 
            "message" => "No qualified candidates for round type: " . $round_type . (isset($previousRoundType) ? " (based on " . $previousRoundType . " round)" : "")
        ));
        exit;
    }
    
    // ==== GET CANDIDATE DETAILS - ONLY FOR QUALIFIED CANDIDATES ====
    $placeholders = implode(',', array_fill(0, count($qualified_candidate_ids), '?'));
    $candidate_sql = "SELECT c.id, c.candidate_no, c.name as candidate_name, c.photo, c.category, 
                            e.event_name
                     FROM candidates c
                     JOIN events e ON c.event_id = e.id
                     WHERE c.id IN ($placeholders)";
    
    $stmt = $mysqli->prepare($candidate_sql);
    $types = str_repeat('i', count($qualified_candidate_ids));
    $stmt->bind_param($types, ...$qualified_candidate_ids);
    $stmt->execute();
    $candidates_result = $stmt->get_result();
    
    $candidates = array();
    
    if ($candidates_result->num_rows > 0) {
        while($row = $candidates_result->fetch_assoc()) {
            // Fix photo path
            $photo_path = null;
            if ($row['photo'] && $row['photo'] !== 'null' && trim($row['photo']) !== '') {
                $photo_path = $row['photo'];
                $photo_path = ltrim($photo_path, '/\\');
                if (!preg_match('/^(\.\.\/|https?:\/\/)/', $photo_path)) {
                    $photo_path = '../contestants/' . $photo_path;
                }
            }
            
            $candidates[$row['id']] = array(
                'id' => $row['id'],
                'candidate_no' => $row['candidate_no'],
                'candidate_name' => $row['candidate_name'],
                'photo' => $photo_path,
                'category' => $row['category'],
                'event_name' => $row['event_name'],
                'total_score' => 0,
                'criteria_scores' => [],
                'criteria_name' => $criteria_id ? '' : 'Overall'
            );
        }
    } else {
        echo json_encode(array("status" => "no_candidates", "message" => "No candidates found"));
        $stmt->close();
        $mysqli->close();
        exit;
    }
    $stmt->close();
    
    // Get criteria for the SPECIFIC round_type
    $criteria_sql = "SELECT id, criteria_name, percentage, round_type, min_score, max_score 
                     FROM criteria 
                     WHERE event_id = ? AND round_type = ?";
    
    $criteria_params = [$event_id, $round_type];
    $criteria_types = "is";
    
    if ($criteria_id !== null) {
        $criteria_sql .= " AND id = ?";
        $criteria_params[] = $criteria_id;
        $criteria_types .= "i";
    }
    
    $criteria_stmt = $mysqli->prepare($criteria_sql);
    $criteria_stmt->bind_param($criteria_types, ...$criteria_params);
    $criteria_stmt->execute();
    $criteria_result = $criteria_stmt->get_result();
    
    $criteria = array();
    
    if ($criteria_result->num_rows > 0) {
        while($row = $criteria_result->fetch_assoc()) {
            $criteria[$row['id']] = $row;
            
            // Get sub-criteria
            $sub_criteria_sql = "SELECT id, sub_criteria_name, percentage, min_score, max_score 
                              FROM sub_criteria 
                              WHERE criteria_id = ?";
            
            $sub_stmt = $mysqli->prepare($sub_criteria_sql);
            $sub_stmt->bind_param("i", $row['id']);
            $sub_stmt->execute();
            $sub_result = $sub_stmt->get_result();
            
            $criteria[$row['id']]['sub_criteria'] = array();
            $criteria[$row['id']]['has_subcriteria'] = ($sub_result->num_rows > 0);
            
            if ($sub_result->num_rows > 0) {
                while($sub_row = $sub_result->fetch_assoc()) {
                    $criteria[$row['id']]['sub_criteria'][$sub_row['id']] = $sub_row;
                }
            }
            
            $sub_stmt->close();
        }
    } else {
        echo json_encode(array(
            "status" => "no_criteria", 
            "message" => "No criteria found for round type: " . $round_type
        ));
        $criteria_stmt->close();
        $mysqli->close();
        exit;
    }
    
    // Get judges who submitted scores for THIS SPECIFIC ROUND TYPE ONLY
    $judge_sql = "SELECT DISTINCT s.judge_id 
                  FROM scores s
                  JOIN candidates c ON s.candidate_id = c.id
                  WHERE c.event_id = ? AND s.round_type = ?";
    
    $judge_stmt = $mysqli->prepare($judge_sql);
    $judge_stmt->bind_param("is", $event_id, $round_type);
    $judge_stmt->execute();
    $judge_result = $judge_stmt->get_result();
    
    $active_judges = array();
    
    if ($judge_result->num_rows > 0) {
        while($row = $judge_result->fetch_assoc()) {
            $active_judges[] = $row['judge_id'];
        }
    }
    
    if (empty($active_judges)) {
        echo json_encode(array(
            "status" => "no_scores", 
            "message" => "No scores found for the selected filters"
        ));
        $criteria_stmt->close();
        $judge_stmt->close();
        $mysqli->close();
        exit;
    }
    
    $judge_stmt->close();
    
    // Calculate scores for qualified candidates in current round
    foreach ($candidates as $candidate_id => $candidate) {
        $total_weighted_criteria_score = 0;
        $total_criteria_percentage = 0;
        $criteria_completion_factor = 0;
        $total_criteria_count = 0;
        
        foreach ($criteria as $crit_id => $criterion) {
            if ($criterion['round_type'] !== $round_type) {
                continue;
            }
            
            $criteria_percentage = floatval($criterion['percentage']);
            $judge_criteria_scores = [];
            $total_criteria_count++;
            
            $has_subcriteria = $criterion['has_subcriteria'];
            
            if ($has_subcriteria) {
                // Process subcriteria
                foreach ($active_judges as $judge_id) {
                    $score_sql = "SELECT s.subcriteria_id, s.score, sc.percentage, sc.min_score, sc.max_score
                              FROM scores s
                              JOIN sub_criteria sc ON s.subcriteria_id = sc.id
                              WHERE s.candidate_id = ? 
                                AND s.criteria_id = ? 
                                AND s.judge_id = ?
                                AND s.round_type = ?";
                    
                    $score_stmt = $mysqli->prepare($score_sql);
                    $score_stmt->bind_param("iiis", $candidate_id, $crit_id, $judge_id, $round_type);
                    $score_stmt->execute();
                    $score_result = $score_stmt->get_result();
                    
                    if ($score_result->num_rows > 0) {
                        $total_weighted_subcriteria_score = 0;
                        $total_subcriteria_percentage = 0;
                        
                        while($score_row = $score_result->fetch_assoc()) {
                            $raw_score = floatval($score_row['score']);
                            $subcriteria_percentage = floatval($score_row['percentage']);
                            $min_score = floatval($score_row['min_score']);
                            $max_score = floatval($score_row['max_score']);
                            
                            $score = max($min_score, min($max_score, $raw_score));
                            
                            $score_range = $max_score - $min_score;
                            if ($score_range > 0) {
                                $normalized_score = (($score - $min_score) / $score_range) * 100;
                            } else {
                                $normalized_score = 0;
                            }
                            
                            $weighted_score = ($normalized_score * $subcriteria_percentage) / 100;
                            $total_weighted_subcriteria_score += $weighted_score;
                            $total_subcriteria_percentage += $subcriteria_percentage;
                        }
                        
                        if ($total_subcriteria_percentage > 0) {
                            $judge_criteria_score = ($total_weighted_subcriteria_score / $total_subcriteria_percentage) * 100;
                            $judge_criteria_scores[] = $judge_criteria_score;
                        }
                    }
                    
                    $score_stmt->close();
                }
            } else {
                // Direct criteria scores
                foreach ($active_judges as $judge_id) {
                    $direct_score_sql = "SELECT s.score
                                        FROM scores s
                                        WHERE s.candidate_id = ? 
                                        AND s.criteria_id = ? 
                                        AND s.judge_id = ?
                                        AND s.subcriteria_id IS NULL
                                        AND s.round_type = ?";
                    
                    $direct_score_stmt = $mysqli->prepare($direct_score_sql);
                    $direct_score_stmt->bind_param("iiis", $candidate_id, $crit_id, $judge_id, $round_type);
                    $direct_score_stmt->execute();
                    $direct_score_result = $direct_score_stmt->get_result();
                    
                    if ($direct_score_result->num_rows > 0) {
                        $score_row = $direct_score_result->fetch_assoc();
                        $raw_score = floatval($score_row['score']);
                        
                        $min_score = floatval($criterion['min_score']);
                        $max_score = floatval($criterion['max_score']);
                        
                        $score = max($min_score, min($max_score, $raw_score));
                        
                        $score_range = $max_score - $min_score;
                        if ($score_range > 0) {
                            $normalized_score = (($score - $min_score) / $score_range) * 100;
                        } else {
                            $normalized_score = 100;
                        }
                        
                        $judge_criteria_scores[] = $normalized_score;
                    }
                    
                    $direct_score_stmt->close();
                }
            }
            
            if (!empty($judge_criteria_scores)) {
                $completion_ratio = count($judge_criteria_scores) / count($active_judges);
                $criteria_avg_score = array_sum($judge_criteria_scores) / count($judge_criteria_scores);
                $weighted_criteria_score = ($criteria_avg_score * $criteria_percentage) / 100;
                $criteria_completion_factor += ($completion_ratio * $criteria_percentage);
                
                $candidates[$candidate_id]['criteria_scores'][$crit_id] = [
                    'name' => $criterion['criteria_name'],
                    'raw_score' => round($criteria_avg_score, 2),
                    'weighted_score' => round($weighted_criteria_score, 2),
                    'percentage' => $criteria_percentage,
                    'judge_count' => count($judge_criteria_scores),
                    'expected_judge_count' => count($active_judges),
                    'completion_ratio' => round($completion_ratio * 100, 1)
                ];
                
                $total_weighted_criteria_score += $weighted_criteria_score;
                $total_criteria_percentage += $criteria_percentage;
                
                if ($criteria_id && $crit_id == $criteria_id) {
                    $candidates[$candidate_id]['criteria_name'] = $criterion['criteria_name'];
                    $candidates[$candidate_id]['completion_ratio'] = round($completion_ratio * 100, 1);
                    $candidates[$candidate_id]['total_score'] = round($criteria_avg_score, 2);
                }
            }
        }
        
        // Calculate overall score
        if (!$criteria_id && $total_criteria_count > 0) {
            if ($total_criteria_percentage > 0) {
                $final_score = ($total_weighted_criteria_score / $total_criteria_percentage) * 100;
                $overall_completion = ($criteria_completion_factor / $total_criteria_percentage) * 100;
                
                $candidates[$candidate_id]['total_score'] = round($final_score, 2);
                $candidates[$candidate_id]['completion_percentage'] = round($overall_completion, 1);
                $candidates[$candidate_id]['partial_results'] = $overall_completion < 100;
                
                if ($show_partial && $overall_completion < 100) {
                    $confidence_adjusted_score = $final_score * ($overall_completion / 100);
                    $candidates[$candidate_id]['confidence_adjusted_score'] = round($confidence_adjusted_score, 2);
                } else {
                    $candidates[$candidate_id]['confidence_adjusted_score'] = round($final_score, 2);
                }
            } else {
                $candidates[$candidate_id]['total_score'] = 0;
                $candidates[$candidate_id]['completion_percentage'] = 0;
                $candidates[$candidate_id]['partial_results'] = true;
            }
        }
    }
    
    // Filter and sort results
    $result_array = array_values(array_filter($candidates, function($candidate) {
        return $candidate['total_score'] > 0;
    }));
    
    if (empty($result_array)) {
        echo json_encode(array(
            "status" => "no_scores_found", 
            "message" => "No scores found for round type: " . $round_type
        ));
    } else {
        usort($result_array, function($a, $b) {
            return $b['total_score'] - $a['total_score'];
        });
        
        for ($i = 0; $i < count($result_array); $i++) {
            $result_array[$i]['rank'] = $i + 1;
        }
        
        $avg_completion = 0;
        $completion_count = 0;
        
        foreach ($result_array as $candidate) {
            if (isset($candidate['completion_percentage']) && $candidate['completion_percentage'] > 0) {
                $avg_completion += $candidate['completion_percentage'];
                $completion_count++;
            }
        }
        
        if ($completion_count > 0) {
            $avg_completion = $avg_completion / $completion_count;
        }
        
        $response = ['results' => $result_array];
        
        if ($avg_completion > 0) {
            $response['completeness'] = [
                'show_partial' => $show_partial,
                'overall_completion_percentage' => round($avg_completion, 1),
                'round_type' => $round_type,
                'active_judges' => $active_judges
            ];
        }
        
        echo json_encode($response);
    }
    
    $criteria_stmt->close();
    $mysqli->close();
    
} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in get_scores.php: " . $e->getMessage());
    echo json_encode(array("error" => $e->getMessage(), "status" => "error"));
}

/**
 * Get top candidate IDs by score calculation
 * Returns array of candidate IDs sorted by score
 */
function getTopCandidatesByScore($mysqli, $event_id, $previous_round_type, $category, $limit) {
    $candidate_ids = [];
    
    // Get all candidates with scores in previous round for this category
    $cand_sql = "SELECT DISTINCT c.id 
                 FROM candidates c
                 JOIN scores s ON c.id = s.candidate_id
                 WHERE c.event_id = ? 
                   AND c.category = ?
                   AND s.round_type = ?";
    
    $cand_stmt = $mysqli->prepare($cand_sql);
    $cand_stmt->bind_param("iss", $event_id, $category, $previous_round_type);
    $cand_stmt->execute();
    $cand_result = $cand_stmt->get_result();
    
    $candidate_scores = [];
    
    while ($row = $cand_result->fetch_assoc()) {
        $candidate_id = $row['id'];
        
        // Calculate score for this candidate
        $score = calculateCandidateScore($mysqli, $candidate_id, $event_id, $previous_round_type);
        
        if ($score !== null && $score > 0) {
            $candidate_scores[$candidate_id] = $score;
        }
    }
    $cand_stmt->close();
    
    // Sort by score descending
    arsort($candidate_scores);
    
    // Get top N
    $candidate_ids = array_slice(array_keys($candidate_scores), 0, $limit, true);
    
    return $candidate_ids;
}

/**
 * Calculate total score for a candidate in a specific round
 */
function calculateCandidateScore($mysqli, $candidate_id, $event_id, $round_type) {
    // Get all criteria for this round
    $criteria_sql = "SELECT id, percentage, min_score, max_score 
                     FROM criteria 
                     WHERE event_id = ? AND round_type = ?";
    
    $criteria_stmt = $mysqli->prepare($criteria_sql);
    $criteria_stmt->bind_param("is", $event_id, $round_type);
    $criteria_stmt->execute();
    $criteria_result = $criteria_stmt->get_result();
    
    $total_weighted_score = 0;
    $total_percentage = 0;
    
    while ($criterion = $criteria_result->fetch_assoc()) {
        $crit_id = $criterion['id'];
        $crit_percentage = floatval($criterion['percentage']);
        
        // Check if has subcriteria
        $sub_check = $mysqli->prepare("SELECT COUNT(*) as cnt FROM sub_criteria WHERE criteria_id = ?");
        $sub_check->bind_param("i", $crit_id);
        $sub_check->execute();
        $sub_check_result = $sub_check->get_result();
        $has_subcriteria = $sub_check_result->fetch_assoc()['cnt'] > 0;
        $sub_check->close();
        
        // Get judges for this criteria
        $judge_sql = "SELECT DISTINCT judge_id FROM scores 
                      WHERE candidate_id = ? AND criteria_id = ? AND round_type = ?";
        $judge_stmt = $mysqli->prepare($judge_sql);
        $judge_stmt->bind_param("iis", $candidate_id, $crit_id, $round_type);
        $judge_stmt->execute();
        $judge_result = $judge_stmt->get_result();
        
        $judge_scores = [];
        
        while ($judge_row = $judge_result->fetch_assoc()) {
            $judge_id = $judge_row['judge_id'];
            
            if ($has_subcriteria) {
                // Calculate subcriteria score
                $sub_sql = "SELECT s.score, sc.percentage, sc.min_score, sc.max_score
                           FROM scores s
                           JOIN sub_criteria sc ON s.subcriteria_id = sc.id
                           WHERE s.candidate_id = ? 
                             AND s.criteria_id = ? 
                             AND s.judge_id = ?
                             AND s.round_type = ?";
                
                $sub_stmt = $mysqli->prepare($sub_sql);
                $sub_stmt->bind_param("iiis", $candidate_id, $crit_id, $judge_id, $round_type);
                $sub_stmt->execute();
                $sub_result = $sub_stmt->get_result();
                
                $weighted_sub_total = 0;
                $sub_percentage_total = 0;
                
                while ($sub_row = $sub_result->fetch_assoc()) {
                    $score = floatval($sub_row['score']);
                    $sub_perc = floatval($sub_row['percentage']);
                    $min = floatval($sub_row['min_score']);
                    $max = floatval($sub_row['max_score']);
                    
                    $range = $max - $min;
                    if ($range > 0) {
                        $normalized = (($score - $min) / $range) * 100;
                        $weighted_sub_total += ($normalized * $sub_perc) / 100;
                        $sub_percentage_total += $sub_perc;
                    }
                }
                
                if ($sub_percentage_total > 0) {
                    $judge_score = ($weighted_sub_total / $sub_percentage_total) * 100;
                    $judge_scores[] = $judge_score;
                }
                
                $sub_stmt->close();
            } else {
                // Direct criteria score
                $direct_sql = "SELECT score FROM scores 
                              WHERE candidate_id = ? 
                                AND criteria_id = ? 
                                AND judge_id = ?
                                AND subcriteria_id IS NULL
                                AND round_type = ?";
                
                $direct_stmt = $mysqli->prepare($direct_sql);
                $direct_stmt->bind_param("iiis", $candidate_id, $crit_id, $judge_id, $round_type);
                $direct_stmt->execute();
                $direct_result = $direct_stmt->get_result();
                
                if ($direct_row = $direct_result->fetch_assoc()) {
                    $score = floatval($direct_row['score']);
                    $min = floatval($criterion['min_score']);
                    $max = floatval($criterion['max_score']);
                    
                    $range = $max - $min;
                    if ($range > 0) {
                        $normalized = (($score - $min) / $range) * 100;
                        $judge_scores[] = $normalized;
                    }
                }
                
                $direct_stmt->close();
            }
        }
        $judge_stmt->close();
        
        // Average judge scores for this criteria
        if (!empty($judge_scores)) {
            $criteria_avg = array_sum($judge_scores) / count($judge_scores);
            $weighted_criteria = ($criteria_avg * $crit_percentage) / 100;
            $total_weighted_score += $weighted_criteria;
            $total_percentage += $crit_percentage;
        }
    }
    
    $criteria_stmt->close();
    
    // Calculate final score
    if ($total_percentage > 0) {
        return ($total_weighted_score / $total_percentage) * 100;
    }
    
    return null;
}
?>