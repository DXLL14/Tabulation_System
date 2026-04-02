<?php
header('Content-Type: application/json');
require_once '../../db/database.php';

try {
    // Fetch contestants with event name from join
    $sql = "SELECT c.*, e.event_name 
            FROM candidates c 
            LEFT JOIN events e ON c.event_id = e.id 
            ORDER BY c.name";
            
    $result = $mysqli->query($sql);
    
    $contestants = [];
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $contestants[] = $row;
        }
    }
    
    echo json_encode($contestants);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

$mysqli->close();
?>