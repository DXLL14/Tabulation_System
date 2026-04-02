<?php
require_once '../db/database.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("SELECT id, event_name FROM events");
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($events);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}