<?php
require_once '../../db/database.php';

header("Content-Type: application/json");

$query = "SELECT id, event_name FROM events";
$result = $mysqli->query($query);

$events = [];
while ($row = $result->fetch_assoc()) {
    $events[] = $row;
}

echo json_encode($events);

$mysqli->close();
?>