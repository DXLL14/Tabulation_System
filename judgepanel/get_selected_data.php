<?php
// Start session
session_start();

// Check if judge is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'judge') {
    echo json_encode([
        'success' => false,
        'message' => 'Not authorized'
    ]);
    exit;
}

// Include database connection
require_once '../db/database.php';

// Get judge ID from session
$judge_id = $_SESSION['user_id'];

try {
    // Get selected data
    $query = "SELECT 
                s.candidate_id,
                s.event_id,
                s.criteria_id,
                s.candidate_number,
                s.candidate_name,
                s.photo,
                s.event_name,
                s.criteria_name,
                s.category,
                s.judge_id,
                c.min_score,
                c.max_score,
                c.percentage,
                c.round_type
              FROM 
                selected_data s
              JOIN 
                criteria c ON s.criteria_id = c.id
              WHERE 
                s.judge_id = ?";
                
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("i", $judge_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $data = $result->fetch_assoc();
        
        // Get subcriteria if any
        $subcriteria_query = "SELECT 
                                id, 
                                criteria_id, 
                                sub_criteria_name, 
                                min_score, 
                                max_score, 
                                percentage 
                              FROM 
                                sub_criteria 
                              WHERE 
                                criteria_id = ?";
                                
        $stmt_sub = $mysqli->prepare($subcriteria_query);
        $stmt_sub->bind_param("i", $data['criteria_id']);
        $stmt_sub->execute();
        $result_sub = $stmt_sub->get_result();
        
        $subcriteria = [];
        while ($row = $result_sub->fetch_assoc()) {
            // Ensure subcriteria ID is treated as a string for consistent comparison
            $row['id'] = (string)$row['id']; 
            $subcriteria[] = $row;
        }
        
        // FETCH EXISTING SCORES HERE BEFORE RETURNING DATA
        $scores_query = "SELECT 
                          id,
                          judge_id,
                          candidate_id,
                          criteria_id,
                          subcriteria_id,
                          score
                        FROM 
                          scores 
                        WHERE 
                          judge_id = ? AND 
                          candidate_id = ? AND 
                          criteria_id = ?";
                          
        $stmt_scores = $mysqli->prepare($scores_query);
        $stmt_scores->bind_param("iii", $judge_id, $data['candidate_id'], $data['criteria_id']);
        $stmt_scores->execute();
        $result_scores = $stmt_scores->get_result();
        
        $scores = [];
        while ($score_row = $result_scores->fetch_assoc()) {
            // Convert subcriteria_id to string for consistent comparison
            if ($score_row['subcriteria_id'] !== null) {
                $score_row['subcriteria_id'] = (string)$score_row['subcriteria_id'];
            }
            $scores[] = $score_row;
        }
        
        // Return all data including scores and round_type
        echo json_encode([
            'success' => true,
            'candidate_id' => $data['candidate_id'],
            'event_id' => $data['event_id'],
            'criteria_id' => $data['criteria_id'],
            'candidate_number' => $data['candidate_number'],
            'candidate_name' => $data['candidate_name'],
            'photo' => $data['photo'],
            'event_name' => $data['event_name'],
            'criteria_name' => $data['criteria_name'],
            'category' => $data['category'],
            'min_score' => $data['min_score'],
            'max_score' => $data['max_score'],
            'percentage' => $data['percentage'],
            'round_type' => $data['round_type'],  // Added round_type
            'subcriteria' => $subcriteria,
            'scores' => $scores
        ]);
        
        $stmt->close();
        $stmt_sub->close();
        $stmt_scores->close();
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No data selected for this judge'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

// Close connection
$mysqli->close();
?>