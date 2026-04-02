<?php
// Start session
session_start();

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);  // Don't display on screen
ini_set('log_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'judge') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

// Include database connection
require_once '../db/database.php';

// Get judge ID from session
$judge_id = $_SESSION['user_id'];

// Get POST data
$candidate_id = isset($_POST['candidate_id']) ? intval($_POST['candidate_id']) : 0;
$criteria_id = isset($_POST['criteria_id']) ? intval($_POST['criteria_id']) : 0;
$scores_json = isset($_POST['scores']) ? $_POST['scores'] : '';

// Debug log
error_log("Submit Score Debug - Judge ID: $judge_id, Candidate ID: $candidate_id, Criteria ID: $criteria_id");
error_log("Scores JSON: $scores_json");

// Validate input
if (!$candidate_id || !$criteria_id || empty($scores_json)) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid input data',
        'debug' => [
            'candidate_id' => $candidate_id,
            'criteria_id' => $criteria_id,
            'scores_json_empty' => empty($scores_json)
        ]
    ]);
    exit;
}

try {
    // Parse scores from JSON
    $scores = json_decode($scores_json, true);
    
    if (!is_array($scores)) {
        throw new Exception('Invalid score data format - not an array');
    }
    
    if (empty($scores)) {
        throw new Exception('No scores provided');
    }
    
    error_log("Parsed scores count: " . count($scores));
    
    // GET THE ROUND_TYPE FROM THE CRITERIA TABLE
    $round_type_stmt = $mysqli->prepare("SELECT round_type, criteria_name FROM criteria WHERE id = ?");
    
    if (!$round_type_stmt) {
        throw new Exception('Database prepare error: ' . $mysqli->error);
    }
    
    $round_type_stmt->bind_param("i", $criteria_id);
    
    if (!$round_type_stmt->execute()) {
        throw new Exception('Error fetching criteria: ' . $round_type_stmt->error);
    }
    
    $round_type_result = $round_type_stmt->get_result();
    
    if ($round_type_result->num_rows === 0) {
        throw new Exception('Invalid criteria ID - criteria not found');
    }
    
    $criteria_row = $round_type_result->fetch_assoc();
    $round_type = $criteria_row['round_type'];
    $criteria_name = $criteria_row['criteria_name'];
    $round_type_stmt->close();
    
    error_log("Round type: $round_type, Criteria name: $criteria_name");
    
    // Begin transaction
    $mysqli->begin_transaction();
    $transaction_active = true;
    
    $records_updated = 0;
    $records_inserted = 0;
    $errors = [];
    
    // Process each score
    foreach ($scores as $index => $score) {
        error_log("Processing score index $index: " . json_encode($score));
        
        if (!isset($score['score'])) {
            $errors[] = "Score at index $index missing 'score' value";
            continue;
        }
        
        $subcriteria_id = isset($score['subcriteria_id']) && $score['subcriteria_id'] !== "" && $score['subcriteria_id'] !== null ? intval($score['subcriteria_id']) : null;
        $score_value = floatval($score['score']);
        
        error_log("Processing: subcriteria_id=$subcriteria_id, score_value=$score_value");
        
        // Check if this specific score already exists
        if ($subcriteria_id === null) {
            // For scores without subcriteria
            $check_sql = "SELECT id FROM scores WHERE judge_id = ? AND candidate_id = ? AND criteria_id = ? AND round_type = ? AND subcriteria_id IS NULL";
            $check_stmt = $mysqli->prepare($check_sql);
            
            if (!$check_stmt) {
                throw new Exception('Check prepare error: ' . $mysqli->error);
            }
            
            $check_stmt->bind_param("iiis", $judge_id, $candidate_id, $criteria_id, $round_type);
        } else {
            // For scores with subcriteria
            $check_sql = "SELECT id FROM scores WHERE judge_id = ? AND candidate_id = ? AND criteria_id = ? AND round_type = ? AND subcriteria_id = ?";
            $check_stmt = $mysqli->prepare($check_sql);
            
            if (!$check_stmt) {
                throw new Exception('Check prepare error: ' . $mysqli->error);
            }
            
            $check_stmt->bind_param("iiisi", $judge_id, $candidate_id, $criteria_id, $round_type, $subcriteria_id);
        }
        
        if (!$check_stmt->execute()) {
            throw new Exception('Check execute error: ' . $check_stmt->error);
        }
        
        $result = $check_stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Score exists, update it
            $row = $result->fetch_assoc();
            $score_id = $row['id'];
            
            error_log("Updating existing score ID: $score_id");
            
            $update_stmt = $mysqli->prepare("UPDATE scores SET score = ? WHERE id = ?");
            
            if (!$update_stmt) {
                throw new Exception('Update prepare error: ' . $mysqli->error);
            }
            
            $update_stmt->bind_param("di", $score_value, $score_id);
            
            if (!$update_stmt->execute()) {
                throw new Exception('Error updating score: ' . $update_stmt->error);
            }
            
            $update_stmt->close();
            $records_updated++;
            error_log("Successfully updated score ID: $score_id");
        } else {
            // Score doesn't exist, insert it
            error_log("Inserting new score");
            
            if ($subcriteria_id === null) {
                // For scores without subcriteria - INCLUDE round_type
                $insert_sql = "INSERT INTO scores (judge_id, candidate_id, criteria_id, round_type, score) VALUES (?, ?, ?, ?, ?)";
                $insert_stmt = $mysqli->prepare($insert_sql);
                
                if (!$insert_stmt) {
                    throw new Exception('Insert prepare error: ' . $mysqli->error);
                }
                
                $insert_stmt->bind_param("iiisd", $judge_id, $candidate_id, $criteria_id, $round_type, $score_value);
            } else {
                // For scores with subcriteria - INCLUDE round_type
                $insert_sql = "INSERT INTO scores (judge_id, candidate_id, criteria_id, round_type, subcriteria_id, score) VALUES (?, ?, ?, ?, ?, ?)";
                $insert_stmt = $mysqli->prepare($insert_sql);
                
                if (!$insert_stmt) {
                    throw new Exception('Insert prepare error: ' . $mysqli->error);
                }
                
                $insert_stmt->bind_param("iiisid", $judge_id, $candidate_id, $criteria_id, $round_type, $subcriteria_id, $score_value);
            }
            
            if (!$insert_stmt->execute()) {
                throw new Exception('Error inserting score: ' . $insert_stmt->error);
            }
            
            error_log("Successfully inserted score ID: " . $mysqli->insert_id);
            
            $insert_stmt->close();
            $records_inserted++;
        }
        
        $check_stmt->close();
    }
    
    // Check if we had any errors
    if (!empty($errors)) {
        throw new Exception('Score processing errors: ' . implode(', ', $errors));
    }
    
    // Commit transaction
    $mysqli->commit();
    $transaction_active = false;
    
    error_log("Transaction committed successfully. Updated: $records_updated, Inserted: $records_inserted");
    
    // Build response message based on what happened
    if ($records_updated > 0 && $records_inserted > 0) {
        $message = "Scores processed: $records_updated updated, $records_inserted newly added";
    } elseif ($records_updated > 0) {
        $message = "Scores updated successfully";
    } else {
        $message = "Scores submitted successfully";
    }
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true, 
        'message' => $message,
        'debug' => [
            'round_type' => $round_type,
            'criteria_name' => $criteria_name,
            'records_updated' => $records_updated,
            'records_inserted' => $records_inserted,
            'total_scores' => count($scores)
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($transaction_active) && $transaction_active) {
        $mysqli->rollback();
        error_log("Transaction rolled back");
    }
    
    $error_message = $e->getMessage();
    error_log("Error in submit_score.php: $error_message");
    error_log("Stack trace: " . $e->getTraceAsString());
    
    // Return error response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'message' => 'Error: ' . $error_message,
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'judge_id' => $judge_id,
            'candidate_id' => $candidate_id,
            'criteria_id' => $criteria_id
        ]
    ]);
}

// Close connection
if (isset($mysqli) && $mysqli) {
    $mysqli->close();
}
?>