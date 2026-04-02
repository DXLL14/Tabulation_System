<?php
require_once '../db/database.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("SELECT id, username FROM users WHERE role = 'judge'");
    $stmt->execute();
    $judges = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($judges);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}