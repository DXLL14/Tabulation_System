<!-- judgepanel/judge.php -->
<?php
session_start();

// License validation - check if system is licensed for this computer
require_once '../check_license.php';

// Check if user is not logged in or not judge
if (!isset($_SESSION['username']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'judge') {
    // Redirect to login page with alert parameter
    header("Location: ../index.html?redirected=true");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Judge Panel - PhilCST Tabulation System</title>
    <link rel="icon" type="image/x-icon" href="../assets/img/philcst6.png">

    <link rel="stylesheet" href="../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="scoring_design.css">
</head>
<body>
    <div class="container-fluid main-container">
        <!-- Header -->
        <div class="header d-flex align-items-center">
            <img src="../assets/img/philcst6.png" alt="Logo" class="logo">
            <h1 id="event-name">Loading Event...</h1>
            <h3 id="judge-name">Loading Judge...</h3>
        </div>

        <!-- Main Content -->
        <div class="content d-flex">
            <!-- Candidate Info -->
            <div class="candidate-section text-center">
                <img id="candidate-photo" src="" alt="Candidate Photo" class="candidate-img">
                <h4 id="candidate-number">Loading...</h4>
                <!-- Candidate name removed from here -->
            </div>

            <div class="scoring-section">
                <div class="scoring-header">
                    <!-- SIMPLIFIED: All in one grid container -->
                    <div id="candidate-num-box" class="candidate-num-box">Loading...</div>
                     <div class="criteria-title-box">
                        <h3 id="criteria-title">Loading Criteria...</h3>
                    </div>
                    <div class="candidate-name-box">
                        <h4 id="candidate-name-info">Loading...</h4>
                    </div>
                </div>
                <div id="criteria-list" class="mt-4">
                    
                </div>
                <button id="submit-button" type="button" class="btn btn-primary" onclick="submitScores()">Submit</button>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>&copy;Created By: Rendell German and John Rick Poral.  © 2025</p>
        </div>
    </div>

    <script src="../assets/js/bootstrap.bundle.min.js"></script>
    <script src="script.js"></script>
    <script src="refresh.js"></script>
    <script>
        let ws;
        let reconnectAttempts = 0;
        const maxReconnects = 3;
        let isForceLoggedOut = false;

        // ✅ Automatically use the same host as the webpage
        const WS_SERVER_URL = `ws://${window.location.hostname}:8080`;

        function connectWebSocket() {
            console.log("🔄 Attempting to connect to WebSocket server at:", WS_SERVER_URL);
            ws = new WebSocket(WS_SERVER_URL);

            ws.onopen = function() {
                console.log("✅ Connected to WebSocket server");
                reconnectAttempts = 0;

                ws.send(JSON.stringify({
                    type: "login",
                    user_id: "<?php echo $_SESSION['user_id']; ?>",
                    username: "<?php echo $_SESSION['username']; ?>"
                }));
                
                console.log("📤 Sent login data");
            };

            ws.onclose = function(event) {
                console.log(`❌ WebSocket closed (code: ${event.code})`);
                
                if (isForceLoggedOut) {
                    console.log("🚪 Force logout detected, not reconnecting");
                    return;
                }
                
                if (reconnectAttempts < maxReconnects && event.code !== 1000) {
                    reconnectAttempts++;
                    console.log(`🔄 Reconnecting... (attempt ${reconnectAttempts}/${maxReconnects})`);
                    setTimeout(connectWebSocket, 2000);
                }
            };

            ws.onerror = function(error) {
                console.error("❌ WebSocket error:", error);
            };

            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    console.log("📨 Received message:", data);
                    
                    if (data.type === 'force_logout') {
                        handleForceLogout(data.message);
                    }
                } catch (err) {
                    console.error("Invalid server message:", err);
                }
            };
        }

        function handleForceLogout(message) {
            console.log("🚪 Handling force logout");
            isForceLoggedOut = true;
            redirectToLogin();
        }

        function redirectToLogin() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close(1000, "Force logout redirect");
            }
            
            fetch('logout.php', { method: 'POST' })
                .then(() => {
                    window.location.href = '../index.html?forced_logout=true';
                })
                .catch(() => {
                    window.location.href = '../index.html?forced_logout=true';
                });
        }

        document.addEventListener('DOMContentLoaded', function() {
            connectWebSocket();
        });

        window.addEventListener("beforeunload", function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close(1000, "Page unloading");
            }
        });
    </script>
</body>
</html>