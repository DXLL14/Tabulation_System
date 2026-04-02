<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

require_once '../../db/database.php';

try {
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        // Check if judge_name exists
        if (!isset($_POST['judge_name']) || empty(trim($_POST['judge_name']))) {
            echo json_encode([
                "success" => false, 
                "message" => "Judge name is required!"
            ]);
            exit();
        }

        $judgeName = trim($_POST['judge_name']);
        
        // Generate username from judge name (lowercase, no spaces)
        $judgeUsername = strtolower(str_replace(' ', '', $judgeName));
        
        // Hash default password
        $defaultPassword = password_hash("judge123", PASSWORD_DEFAULT);

        // First, check if username already exists
        $checkSql = "SELECT id FROM users WHERE username = ?";
        $checkStmt = $mysqli->prepare($checkSql);
        $checkStmt->bind_param("s", $judgeUsername);
        $checkStmt->execute();
        $checkStmt->store_result();
        
        if ($checkStmt->num_rows > 0) {
            echo json_encode([
                "success" => false, 
                "message" => "A judge with username '$judgeUsername' already exists!"
            ]);
            $checkStmt->close();
            $mysqli->close();
            exit();
        }
        $checkStmt->close();

        // Insert the new judge (without name column since it doesn't exist)
        $sql = "INSERT INTO users (username, password, role, is_active) VALUES (?, ?, 'judge', 0)";
        $stmt = $mysqli->prepare($sql);
        
        if (!$stmt) {
            echo json_encode([
                "success" => false, 
                "message" => "Failed to prepare statement: " . $mysqli->error
            ]);
            exit();
        }
        
        $stmt->bind_param("ss", $judgeUsername, $defaultPassword);
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true, 
                "message" => "Judge added successfully!"
            ]);
        } else {
            echo json_encode([
                "success" => false, 
                "message" => "Failed to add judge: " . $stmt->error
            ]);
        }
        
        $stmt->close();
    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Invalid request method!"
        ]);
    }

    $mysqli->close();
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "message" => "An error occurred: " . $e->getMessage()
    ]);
}
?>