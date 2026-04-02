<?php
// Include database connection
require_once '../../db/database.php';
header('Content-Type: application/json');

$inputData = file_get_contents('php://input');
$data = json_decode($inputData, true);

// Validate input
if (!isset($data['event_name']) || empty($data['event_name'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Event name is required'
    ]);
    exit;
}

try {
    $mysqli->begin_transaction();

    // Insert event
    $eventName = $data['event_name'];
    $stmt = $mysqli->prepare("INSERT INTO events (event_name) VALUES (?)");
    $stmt->bind_param("s", $eventName);
    $stmt->execute();
    
    $eventId = $mysqli->insert_id;
    
    // Process regular criteria
    if (isset($data['criteria']) && is_array($data['criteria'])) {
        processCriteria($mysqli, $data['criteria'], $eventId, 'regular');
    }
    
    // Process round criteria
    if (isset($data['round_criteria']) && is_array($data['round_criteria'])) {
        foreach ($data['round_criteria'] as $roundCriteria) {
            $roundType = $roundCriteria['round_type'];
            if (isset($roundCriteria['criteria']) && is_array($roundCriteria['criteria'])) {
                processCriteria($mysqli, $roundCriteria['criteria'], $eventId, $roundType);
            }
        }
    }
    
    // Commit transaction
    $mysqli->commit();
    
    // Return success
    echo json_encode([
        'status' => 'success',
        'message' => 'Event added successfully',
        'event_id' => $eventId
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $mysqli->rollback();
    
    // Return error
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

// Helper function to process criteria
function processCriteria($mysqli, $criteriaList, $eventId, $roundType) {
    foreach ($criteriaList as $criteria) {
        // Check required fields
        if (!isset($criteria['name']) || empty($criteria['name'])) {
            throw new Exception("Criteria name is required");
        }

        $criteriaName = $criteria['name'];
        $criteriaPercentage = isset($criteria['percentage']) ? floatval($criteria['percentage']) : 0.00;
        $criteriaMinScore = isset($criteria['min_score']) ? floatval($criteria['min_score']) : 1.00;
        $criteriaMaxScore = isset($criteria['max_score']) ? floatval($criteria['max_score']) : 10.00;
        $weight = 0.00;
        
        // Insert criteria with round_type
        $stmt = $mysqli->prepare("INSERT INTO criteria (criteria_name, weight, percentage, min_score, max_score, event_id, round_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sddddis", $criteriaName, $weight, $criteriaPercentage, $criteriaMinScore, $criteriaMaxScore, $eventId, $roundType);
        $stmt->execute();
        
        $criteriaId = $mysqli->insert_id;
        
        if (isset($criteria['sub_criteria']) && is_array($criteria['sub_criteria']) && count($criteria['sub_criteria']) > 0) {
            foreach ($criteria['sub_criteria'] as $subCriteria) {
                // Check required fields
                if (!isset($subCriteria['name']) || empty($subCriteria['name'])) {
                    throw new Exception("Sub-criteria name is required");
                }
                
                $subCriteriaName = $subCriteria['name'];
                $subCriteriaPercentage = isset($subCriteria['percentage']) ? floatval($subCriteria['percentage']) : 0.00;
                $subCriteriaMinScore = isset($subCriteria['min_score']) ? floatval($subCriteria['min_score']) : 1.00;
                $subCriteriaMaxScore = isset($subCriteria['max_score']) ? floatval($subCriteria['max_score']) : 10.00;
                
                // Insert sub-criteria
                $stmt = $mysqli->prepare("INSERT INTO sub_criteria (criteria_id, sub_criteria_name, min_score, max_score, percentage) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("isddd", $criteriaId, $subCriteriaName, $subCriteriaMinScore, $subCriteriaMaxScore, $subCriteriaPercentage);
                $stmt->execute();
            }
        }
    }
}

// Close connection
$mysqli->close();
?>