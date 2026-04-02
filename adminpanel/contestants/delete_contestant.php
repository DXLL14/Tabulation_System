<?php
require_once '../../db/database.php';

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['id'])) {
    $id = $_POST['id'];

    $stmt = $mysqli->prepare("DELETE FROM candidates WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => $stmt->error]);
    }
    
    $mysqli->close();
}
?>