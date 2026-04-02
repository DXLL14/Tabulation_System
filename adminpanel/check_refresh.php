<?php
require_once '../db/database.php';

$result = $mysqli->query("SELECT value FROM should_refresh WHERE id = 1");
$row = $result->fetch_assoc();

echo $row['value']; // return current refresh count

$mysqli->close();
?>