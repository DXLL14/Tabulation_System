<?php
require_once '../../db/database.php';

// Function to get local IP address (Windows-friendly, no sockets needed)
function getLocalIPAddress() {
    $hostname = gethostname();
    $ip = gethostbyname($hostname);
    
    // Validate it's IPv4 and not loopback
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && $ip !== '127.0.0.1') {
        return $ip;
    }
    
    return '127.0.0.1'; // Fallback to loopback
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['judge_id'])) {
    $judge_id = (int)$_POST['judge_id'];

    // Check if judge exists and get current status
    $check_stmt = $mysqli->prepare("SELECT is_active, username FROM users WHERE id = ? AND role = 'judge'");
    $check_stmt->bind_param("i", $judge_id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $row = $result->fetch_assoc();
    $check_stmt->close();

    if ($row) {
        if ($row['is_active'] == 1) {
            // Send WebSocket message to force logout the specific judge
            $websocket_data = [
                'user_id' => $judge_id,
                'message' => 'Logged out by an administrator.'
            ];
            
            // Send to WebSocket server
            $result = sendToWebSocket($websocket_data);
            
            if ($result) {
                echo json_encode([
                    "success" => true, 
                    "message" => "Judge '{$row['username']}' has been forced to logout.",
                    "action" => "forced_logout"
                ]);
            } else {
                echo json_encode([
                    "success" => false, 
                    "message" => "Failed to send logout command to judge. WebSocket server may be offline."
                ]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Judge is already logged out."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Judge not found."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request."]);
}

$mysqli->close();

// Function to send message to WebSocket server
function sendToWebSocket($data) {
    // Get the local IP using the new function (mimics server.js logic)
    $server_host = getLocalIPAddress();
    
    // WebSocket server port
    $ws_port = 8080;
    
    // Build the WebSocket endpoint URL
    $url = "http://{$server_host}:{$ws_port}/force-logout";
    
    error_log("Connecting to: $url");
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    curl_close($ch);
    
    // Log for debugging
    error_log("URL: $url | HTTP Code: $httpCode | Response: $result | cURL Error: $curlError");
    
    return ($httpCode == 200);
}
?>