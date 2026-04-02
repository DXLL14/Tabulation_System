<?php
// Start session for judge identification
session_start();

// Database connection
require_once '../db/database.php';

// Get parameters from request
$candidateId = isset($_GET['candidate_id']) ? intval($_GET['candidate_id']) : 0;
$criteriaId = isset($_GET['criteria_id']) ? intval($_GET['criteria_id']) : 0;
$judgeId = isset($_SESSION['judge_id']) ? intval($_SESSION['judge_id']) : 0;

// Validate inputs
if ($candidateId <= 0 || $criteriaId <= 0 || $judgeId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    exit;
}

try {
    // Query to get scores from database
    $query = "SELECT id, subcriteria_id, score FROM scores 
              WHERE judge_id = ? AND candidate_id = ? AND criteria_id = ?";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('iii', $judgeId, $candidateId, $criteriaId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $scores = [];
    while ($row = $result->fetch_assoc()) {
        // Convert scores from decimal(5,2) to float and handle NULL properly
        $scores[] = [
            'id' => (int)$row['id'],
            'subcriteria_id' => $row['subcriteria_id'] !== null ? (string)$row['subcriteria_id'] : null,
            'score' => (float)$row['score']
        ];
    }
    
    // Debug output
    error_log("Scores fetched from DB: " . json_encode($scores));
    
    echo json_encode([
        'success' => true,
        'scores' => $scores
    ]);
    
    $stmt->close();
    $mysqli->close();
    
} catch (Exception $e) {
    error_log("Error in get_scores.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>