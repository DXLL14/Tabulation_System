<?php
session_start();

require_once 'db/database.php';

if (isset($_SESSION['user_id'])) {
    $user_id = (int)$_SESSION['user_id'];

    $update = "UPDATE users SET is_active = 0 WHERE id = ?";
    $stmt = $mysqli->prepare($update);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->close();
}

$mysqli->close();

session_unset();
session_destroy();

header("Location: index.html");
exit();
?>