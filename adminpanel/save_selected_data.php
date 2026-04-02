<?php
require_once '../db/database.php';
header('Content-Type: application/json');

// Get JSON data from request
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

// Validate data
if (!isset($data['event_id']) || !isset($data['category']) || 
    !isset($data['candidate_id']) || !isset($data['criteria_id']) || 
    !isset($data['judge_ids']) || empty($data['judge_ids'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

// Start transaction
$pdo->beginTransaction();

try {
    // Get candidate information
    $candidateStmt = $pdo->prepare("SELECT candidate_no, name, photo FROM candidates WHERE id = ?");
    $candidateStmt->execute([$data['candidate_id']]);
    $candidate = $candidateStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$candidate) {
        throw new Exception("Candidate not found");
    }
    
    // Get event name
    $eventStmt = $pdo->prepare("SELECT event_name FROM events WHERE id = ?");
    $eventStmt->execute([$data['event_id']]);
    $event = $eventStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$event) {
        throw new Exception("Event not found");
    }
    
    // Get criteria name
    $criteriaStmt = $pdo->prepare("SELECT criteria_name FROM criteria WHERE id = ?");
    $criteriaStmt->execute([$data['criteria_id']]);
    $criteria = $criteriaStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$criteria) {
        throw new Exception("Criteria not found");
    }
    
    // Check if we need to add new entry or update existing entry for each judge
    $successCount = 0;
    $errorMessages = [];
    
    foreach ($data['judge_ids'] as $judgeId) {
        // Check if this judge already has an entry
        $checkStmt = $pdo->prepare("SELECT id FROM selected_data WHERE judge_id = ?");
        $checkStmt->execute([$judgeId]);
        $existingEntry = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingEntry) {
            // Update existing entry
            $updateStmt = $pdo->prepare("UPDATE selected_data SET 
                candidate_id = ?,
                event_id = ?,
                criteria_id = ?,
                candidate_number = ?,
                candidate_name = ?,
                photo = ?,
                event_name = ?,
                criteria_name = ?,
                category = ?
                WHERE judge_id = ?");
                
            $updateResult = $updateStmt->execute([
                $data['candidate_id'],
                $data['event_id'],
                $data['criteria_id'],
                $candidate['candidate_no'],
                $candidate['name'],
                $candidate['photo'],
                $event['event_name'],
                $criteria['criteria_name'],
                $data['category'],
                $judgeId
            ]);
            
            if ($updateResult) {
                $successCount++;
            } else {
                $errorMessages[] = "Failed to update judge ID $judgeId";
            }
        } else {
            // Insert new entry
            $insertStmt = $pdo->prepare("INSERT INTO selected_data (
                candidate_id,
                event_id,
                criteria_id,
                candidate_number,
                candidate_name,
                photo,
                event_name,
                criteria_name,
                category,
                judge_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                
            $insertResult = $insertStmt->execute([
                $data['candidate_id'],
                $data['event_id'],
                $data['criteria_id'],
                $candidate['candidate_no'],
                $candidate['name'],
                $candidate['photo'],
                $event['event_name'],
                $criteria['criteria_name'],
                $data['category'],
                $judgeId
            ]);
            
            if ($insertResult) {
                $successCount++;
            } else {
                $errorMessages[] = "Failed to insert judge ID $judgeId";
            }
        }
    }
    
    // Commit transaction
    $pdo->commit();
    
    if ($successCount === count($data['judge_ids'])) {
        echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
    } else {
        echo json_encode([
            'success' => true,
            'message' => "Saved $successCount out of " . count($data['judge_ids']) . " judges. Errors: " . implode(", ", $errorMessages)
        ]);
    }
    
} catch (Exception $e) {
    // Rollback transaction on error
    $pdo->rollBack();
    
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}