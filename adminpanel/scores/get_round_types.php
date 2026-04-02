<?php
require_once '../../db/database.php';

header('Content-Type: application/json');

if (!isset($_GET['event_id'])) {
    echo json_encode([]);
    exit;
}

$event_id = intval($_GET['event_id']);

$sql = "SELECT DISTINCT round_type 
        FROM criteria 
        WHERE event_id = ? 
        AND round_type IS NOT NULL 
        AND round_type != ''
        ORDER BY 
            CASE round_type
                WHEN 'regular' THEN 1
                WHEN 'top10' THEN 2
                WHEN 'top5' THEN 3
                WHEN 'top3' THEN 4
                ELSE 5
            END";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("i", $event_id);
$stmt->execute();
$result = $stmt->get_result();

$round_types = [];
while ($row = $result->fetch_assoc()) {
    $round_types[] = [
        'round_type' => $row['round_type']
    ];
}

echo json_encode($round_types);

$stmt->close();
$mysqli->close();
?>