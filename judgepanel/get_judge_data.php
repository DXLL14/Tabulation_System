<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'judge') {
    echo json_encode([
        'success' => false,
        'message' => 'Not logged in or not authorized as judge'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'judge_id' => $_SESSION['user_id'],
    'judge_username' => $_SESSION['username']
]);
?>