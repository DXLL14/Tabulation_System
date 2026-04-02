<?php
require_once '../db/database.php';
header('Content-Type: application/json');

// Get the most recent admin selection from the database
$query = "SELECT candidate_id, event_id, criteria_id, category 
          FROM admin_selections 
          ORDER BY updated_at DESC 
          LIMIT 1";

$result = $mysqli->query($query);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'candidate_id' => $row['candidate_id'],
        'event_id' => $row['event_id'],
        'criteria_id' => $row['criteria_id'],
        'category' => $row['category']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No selection found'
    ]);
}

$mysqli->close();
?>