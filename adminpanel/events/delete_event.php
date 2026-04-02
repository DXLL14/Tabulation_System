<?php
// Include database connection
require_once '../../db/database.php';

// Set headers
header('Content-Type: application/json');

// Get JSON input
$inputData = file_get_contents('php://input');
$data = json_decode($inputData, true);

// Validate input
if (!isset($data['eventId']) || empty($data['eventId'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Event ID is required'
    ]);
    exit;
}

try {
    // Start transaction
    $mysqli->begin_transaction();

    $eventId = intval($data['eventId']);
    
    // Check if event exists
    $stmt = $mysqli->prepare("SELECT id FROM events WHERE id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Event not found");
    }
    
    // Delete selected_data records related to this event
    $stmt = $mysqli->prepare("DELETE FROM selected_data WHERE event_id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    
    // Delete scores related to this event through candidates and criteria
    $stmt = $mysqli->prepare("DELETE FROM scores WHERE candidate_id IN (SELECT id FROM candidates WHERE event_id = ?) OR criteria_id IN (SELECT id FROM criteria WHERE event_id = ?)");
    $stmt->bind_param("ii", $eventId, $eventId);
    $stmt->execute();
    
    // Get all criteria for this event
    $stmt = $mysqli->prepare("SELECT id FROM criteria WHERE event_id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $criteriaId = $row['id'];
        
        // Delete sub-criteria
        $stmt2 = $mysqli->prepare("DELETE FROM sub_criteria WHERE criteria_id = ?");
        $stmt2->bind_param("i", $criteriaId);
        $stmt2->execute();
    }
    
    // Delete candidates related to this event
    $stmt = $mysqli->prepare("DELETE FROM candidates WHERE event_id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    
    // Delete criteria
    $stmt = $mysqli->prepare("DELETE FROM criteria WHERE event_id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    
    // Delete event
    $stmt = $mysqli->prepare("DELETE FROM events WHERE id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    
    // Commit transaction
    $mysqli->commit();
    
    // Return success
    echo json_encode([
        'status' => 'success',
        'message' => 'Event deleted successfully'
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

// Close connection
$mysqli->close();
?>