<?php
require_once '../../db/database.php';

header('Content-Type: application/json');

try {
    $sql = "SELECT id, event_name FROM events";
    $result = $mysqli->query($sql);
    
    $events = array();
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $events[] = $row;
        }
    }
    
    echo json_encode($events);
    
    $mysqli->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => $e->getMessage()));
}
?>