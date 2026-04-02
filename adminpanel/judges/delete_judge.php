<?php
header('Content-Type: application/json');

require_once '../../db/database.php';

if (isset($_POST['judge_id'])) {
    $id = intval($_POST['judge_id']);

    $sql = "DELETE FROM users WHERE id = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Judge deleted successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete judge!"]);
    }

    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "No judge ID provided!"]);
}

$mysqli->close();
?>