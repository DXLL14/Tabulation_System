<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in as admin
if (!isset($_SESSION['username']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access'
    ]);
    exit();
}

require_once '../../db/database.php';

try {
    // Get the JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['password']) || empty($input['password'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Password is required'
        ]);
        exit();
    }
    
    $password = $input['password'];
    $username = $_SESSION['username'];
    
    // Get the admin user's hashed password from database
    $stmt = $mysqli->prepare("SELECT password FROM users WHERE username = ? AND role = 'admin'");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Admin user not found'
        ]);
        exit();
    }
    
    $row = $result->fetch_assoc();
    $hashedPassword = $row['password'];
    
    // Check if password is correct
    $isPasswordCorrect = false;
    
    // Check if it's a bcrypt hash (starts with $2y$)
    if (substr($hashedPassword, 0, 4) === '$2y$') {
        // Use password_verify for bcrypt
        $isPasswordCorrect = password_verify($password, $hashedPassword);
    } else {
        // Assume it's MD5 hash, compare directly
        $isPasswordCorrect = (md5($password) === $hashedPassword);
    }
    
    if ($isPasswordCorrect) {
        echo json_encode([
            'success' => true,
            'message' => 'Password verified'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Incorrect password'
        ]);
    }
    
    $stmt->close();
    $mysqli->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>