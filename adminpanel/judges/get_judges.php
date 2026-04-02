<?php
// get_judges.php - Fixed version
header('Content-Type: application/json');

require_once '../../db/database.php';

$sql = "SELECT id, username, username AS name, is_active FROM users WHERE role = 'judge'";
$result = $mysqli->query($sql);

$judges = [];
while ($row = $result->fetch_assoc()) {
    // Convert is_active to boolean for easier handling in JavaScript
    $row['is_active'] = (int)$row['is_active']; // Ensure it's an integer
    $judges[] = $row;
}

echo json_encode($judges);
$mysqli->close();
?>