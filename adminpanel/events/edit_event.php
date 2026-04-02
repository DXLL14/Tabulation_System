<?php
require_once '../../db/database.php';
header('Content-Type: application/json');

// Get JSON data from request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Initialize response
$response = ['status' => 'error', 'message' => 'Unknown error occurred'];

// Validate input
if (!$json || json_last_error() !== JSON_ERROR_NONE) {
    $response['message'] = 'Invalid JSON data';
    echo json_encode($response);
    exit;
}

if (!isset($data['event_id']) || !isset($data['event_name'])) {
    $response['message'] = 'Missing required fields';
    echo json_encode($response);
    exit;
}

// Start transaction
$mysqli->begin_transaction();

try {
    $eventId = $data['event_id'];
    $eventName = $data['event_name'];
    
    // Update event name
    $stmtEvent = $mysqli->prepare("UPDATE events SET event_name = ? WHERE id = ?");
    $stmtEvent->bind_param("si", $eventName, $eventId);
    $stmtEvent->execute();
    
    // Get existing criteria IDs for this event
    $stmtGetCriteria = $mysqli->prepare("SELECT id FROM criteria WHERE event_id = ?");
    $stmtGetCriteria->bind_param("i", $eventId);
    $stmtGetCriteria->execute();
    $resultCriteria = $stmtGetCriteria->get_result();
    
    $existingCriteriaIds = [];
    while ($row = $resultCriteria->fetch_assoc()) {
        $existingCriteriaIds[] = $row['id'];
    }
    
    // Track criteria IDs from request
    $requestCriteriaIds = [];
    
    // Process regular criteria
    if (isset($data['criteria']) && is_array($data['criteria'])) {
        processEditCriteria($mysqli, $data['criteria'], $eventId, 'regular', $requestCriteriaIds);
    }
    
    // Process round criteria
    if (isset($data['round_criteria']) && is_array($data['round_criteria'])) {
        foreach ($data['round_criteria'] as $roundCriteria) {
            $roundType = $roundCriteria['round_type'];
            if (isset($roundCriteria['criteria']) && is_array($roundCriteria['criteria'])) {
                processEditCriteria($mysqli, $roundCriteria['criteria'], $eventId, $roundType, $requestCriteriaIds);
            }
        }
    }
    
    // Delete criteria not in request
    if (!empty($existingCriteriaIds) && !empty($requestCriteriaIds)) {
        $criteriaToDelete = array_diff($existingCriteriaIds, $requestCriteriaIds);
        
        if (!empty($criteriaToDelete)) {
            $placeholders = str_repeat('?,', count($criteriaToDelete) - 1) . '?';
            
            // First delete sub_criteria
            $sqlSub = "DELETE FROM sub_criteria WHERE criteria_id IN ($placeholders)";
            $stmtSub = $mysqli->prepare($sqlSub);
            $bindTypes = str_repeat('i', count($criteriaToDelete));
            $stmtSub->bind_param($bindTypes, ...$criteriaToDelete);
            $stmtSub->execute();
            
            // Then delete criteria
            $sql = "DELETE FROM criteria WHERE id IN ($placeholders)";
            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param($bindTypes, ...$criteriaToDelete);
            $stmt->execute();
        }
    }
    
    // Commit transaction
    $mysqli->commit();
    
    // Return success response
    $response = [
        'status' => 'success',
        'message' => 'Event updated successfully',
        'event_id' => $eventId
    ];
    
} catch (Exception $e) {
    // Rollback transaction on error
    $mysqli->rollback();
    
    // Return error response
    $response = [
        'status' => 'error',
        'message' => 'Error updating event: ' . $e->getMessage()
    ];
}

// Helper function to process criteria during edit
function processEditCriteria($mysqli, $criteriaList, $eventId, $roundType, &$requestCriteriaIds) {
    foreach ($criteriaList as $criteria) {
        $criteriaName = $criteria['name'];
        $criteriaMinScore = isset($criteria['min_score']) ? floatval($criteria['min_score']) : 1.00;
        $criteriaMaxScore = isset($criteria['max_score']) ? floatval($criteria['max_score']) : 10.00;
        $criteriaPercentage = isset($criteria['percentage']) ? floatval($criteria['percentage']) : 0.00;
        
        // If ID is provided, update existing criteria
        if (isset($criteria['id']) && !empty($criteria['id'])) {
            $criteriaId = $criteria['id'];
            $requestCriteriaIds[] = $criteriaId;
            
            // Update existing criteria
            $stmtUpdateCriteria = $mysqli->prepare("UPDATE criteria SET criteria_name = ?, min_score = ?, max_score = ?, percentage = ?, round_type = ? WHERE id = ?");
            $stmtUpdateCriteria->bind_param("sdddss", $criteriaName, $criteriaMinScore, $criteriaMaxScore, $criteriaPercentage, $roundType, $criteriaId);
            $stmtUpdateCriteria->execute();
        } 
        else {
            // Insert new criteria
            $weight = 0.00;
            $stmtInsertCriteria = $mysqli->prepare("INSERT INTO criteria (event_id, criteria_name, min_score, max_score, percentage, round_type, weight) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmtInsertCriteria->bind_param("isdddss", $eventId, $criteriaName, $criteriaMinScore, $criteriaMaxScore, $criteriaPercentage, $roundType, $weight);
            $stmtInsertCriteria->execute();
            $criteriaId = $mysqli->insert_id;
            $requestCriteriaIds[] = $criteriaId;
        }
        
        // Process sub-criteria
        if (isset($criteria['sub_criteria']) && is_array($criteria['sub_criteria'])) {
            processEditSubCriteria($mysqli, $criteria['sub_criteria'], $criteriaId);
        }
    }
}

// Helper function to process sub-criteria during edit
function processEditSubCriteria($mysqli, $subCriteriaList, $criteriaId) {
    // Get existing sub-criteria IDs
    $stmtGetSub = $mysqli->prepare("SELECT id FROM sub_criteria WHERE criteria_id = ?");
    $stmtGetSub->bind_param("i", $criteriaId);
    $stmtGetSub->execute();
    $resultSub = $stmtGetSub->get_result();
    
    $existingSubCriteriaIds = [];
    while ($row = $resultSub->fetch_assoc()) {
        $existingSubCriteriaIds[] = $row['id'];
    }
    
    $requestSubCriteriaIds = [];
    
    foreach ($subCriteriaList as $subCriteria) {
        $subCriteriaName = $subCriteria['name'];
        $subCriteriaMinScore = isset($subCriteria['min_score']) ? floatval($subCriteria['min_score']) : 1.00;
        $subCriteriaMaxScore = isset($subCriteria['max_score']) ? floatval($subCriteria['max_score']) : 10.00;
        $subCriteriaPercentage = isset($subCriteria['percentage']) ? floatval($subCriteria['percentage']) : 0.00;
        
        // If ID is provided, update existing sub-criteria
        if (isset($subCriteria['id']) && !empty($subCriteria['id'])) {
            $subCriteriaId = $subCriteria['id'];
            $requestSubCriteriaIds[] = $subCriteriaId;
            
            // Update existing sub-criteria
            $stmtUpdateSub = $mysqli->prepare("UPDATE sub_criteria SET sub_criteria_name = ?, min_score = ?, max_score = ?, percentage = ? WHERE id = ?");
            $stmtUpdateSub->bind_param("sdddi", $subCriteriaName, $subCriteriaMinScore, $subCriteriaMaxScore, $subCriteriaPercentage, $subCriteriaId);
            $stmtUpdateSub->execute();
        } 
        else {
            // Insert new sub-criteria
            $stmtInsertSub = $mysqli->prepare("INSERT INTO sub_criteria (criteria_id, sub_criteria_name, min_score, max_score, percentage) VALUES (?, ?, ?, ?, ?)");
            $stmtInsertSub->bind_param("isddd", $criteriaId, $subCriteriaName, $subCriteriaMinScore, $subCriteriaMaxScore, $subCriteriaPercentage);
            $stmtInsertSub->execute();
            $requestSubCriteriaIds[] = $mysqli->insert_id;
        }
    }
    
    // Delete sub-criteria not in request
    if (!empty($existingSubCriteriaIds) && !empty($requestSubCriteriaIds)) {
        $subToDelete = array_diff($existingSubCriteriaIds, $requestSubCriteriaIds);
        
        if (!empty($subToDelete)) {
            $placeholders = str_repeat('?,', count($subToDelete) - 1) . '?';
            $sql = "DELETE FROM sub_criteria WHERE id IN ($placeholders)";
            $stmt = $mysqli->prepare($sql);
            $bindTypes = str_repeat('i', count($subToDelete));
            $stmt->bind_param($bindTypes, ...$subToDelete);
            $stmt->execute();
        }
    }
}

// Return JSON response
echo json_encode($response);
$mysqli->close();
?>