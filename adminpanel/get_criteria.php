<?php
require_once '../db/database.php';
header('Content-Type: application/json');

$eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

if ($eventId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid event ID']);
    exit;
}

try {
    $stmt = $mysqli->prepare("
        SELECT id, criteria_name, round_type 
        FROM criteria 
        WHERE event_id = ? 
        ORDER BY 
            CASE round_type
                WHEN 'regular' THEN 1
                WHEN 'top10' THEN 2
                WHEN 'top5' THEN 3
                WHEN 'top3' THEN 4
            END,
            criteria_name
    ");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $criteria = [];
    while ($row = $result->fetch_assoc()) {
        // Format display text with round type
        $roundTypeLabel = '';
        switch($row['round_type']) {
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
        
        $criteria[] = [
            'id' => $row['id'],
            'criteria_name' => $row['criteria_name'],
            'round_type' => $row['round_type'],
            'display_name' => $row['criteria_name'] . ' - ' . $roundTypeLabel
        ];
    }
    
    echo json_encode($criteria);
    $stmt->close();
    $mysqli->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>