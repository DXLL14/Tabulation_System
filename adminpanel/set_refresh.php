<?php
require_once '../db/database.php';

$update = "UPDATE should_refresh SET value = value + 1 WHERE id = 1";
if ($mysqli->query($update)) {
    echo "Refresh value incremented.";
} else {
    echo "Error: " . $mysqli->error;
}

$mysqli->close();
?>