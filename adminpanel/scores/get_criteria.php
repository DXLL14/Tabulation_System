<?php
require_once '../../db/database.php';

header('Content-Type: application/json');

if (!isset($_GET['event_id'])) {
    echo json_encode([]);
    exit;
}

$event_id = intval($_GET['event_id']);
$round_type = isset($_GET['round_type']) ? $_GET['round_type'] : '';

$sql = "SELECT id, criteria_name, percentage, round_type FROM criteria WHERE event_id = ?";

if ($round_type && $round_type !== '') {
    $sql .= " AND round_type = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("is", $event_id, $round_type);
} else {
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $event_id);
}

$stmt->execute();
$result = $stmt->get_result();

$criteria = [];
while ($row = $result->fetch_assoc()) {
    $criteria[] = $row;
}

echo json_encode($criteria);

$stmt->close();
$mysqli->close();
?>