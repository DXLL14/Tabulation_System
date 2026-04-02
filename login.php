<?php
session_start();
ob_start();

// License validation - check if system is licensed for this computer
require_once 'check_license.php';

// Database connection
require_once 'db/database.php';

/*-----------------------------------
| NODE.JS BACKGROUND STARTER
------------------------------------*/
function isNodeJSRunning() {
    $output = shell_exec('tasklist /FI "IMAGENAME eq node.exe" 2>NUL');
    return strpos($output, "node.exe") !== false;
}

function startNodeJS() {
    if (!isNodeJSRunning()) {
        $project_root = dirname(__FILE__);
        $ws_server_path = $project_root . "\\ws-server";
        $vbs_script = $project_root . "\\start_node.vbs";

        $vbs_content = 'Set WshShell = CreateObject("WScript.Shell")' . "\r\n";
        $vbs_content .= 'WshShell.CurrentDirectory = "' . $ws_server_path . '"' . "\r\n";
        $vbs_content .= 'WshShell.Run "cmd /c node server.js", 0, False' . "\r\n";

        file_put_contents($vbs_script, $vbs_content);
        pclose(popen("start /B wscript.exe \"$vbs_script\"", "r"));

        sleep(1);
        if (file_exists($vbs_script)) unlink($vbs_script);

        return true;
    }
    return false;
}

/*-----------------------------------
| LOGIN HANDLER
------------------------------------*/
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    $sql = "SELECT * FROM users WHERE username = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        // Make sure role is not empty (auto fix missing role)
        if (empty($row['role'])) {
            // Auto-detect by password format
            if (strlen($row['password']) == 32) {
                $row['role'] = 'admin';
            } elseif (strpos($row['password'], '$2y$') === 0) {
                $row['role'] = 'judge';
            }

            // Update the database
            $updateRole = $mysqli->prepare("UPDATE users SET role = ? WHERE id = ?");
            $updateRole->bind_param("si", $row['role'], $row['id']);
            $updateRole->execute();
            $updateRole->close();
        }

        $stored_password = $row['password'];
        $role = $row['role'];
        $user_id = (int)$row['id'];

        $valid = false;

        // Validate password depending on role
        if ($role === 'admin' && md5($password) === $stored_password) {
            $valid = true;
        } elseif ($role === 'judge' && password_verify($password, $stored_password)) {
            $valid = true;
        }

        if ($valid) {
            // Prevent double login
            if ($row['is_active'] == 1) {
                header("Location: index.html?error=" . urlencode("This account is already logged in!"));
                exit();
            }

            // Judge cannot login if no admin is active
            if ($role === 'judge') {
                $admin_check = "SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin' AND is_active = 1";
                $admin_result = $mysqli->query($admin_check);
                $admin_row = $admin_result->fetch_assoc();

                if ($admin_row['admin_count'] == 0) {
                    header("Location: index.html?error=" . urlencode("Cannot login: No admin is currently active!"));
                    exit();
                }
            }

            // Set session
            $_SESSION['username'] = $username;
            $_SESSION['role'] = $role;
            $_SESSION['user_id'] = $user_id;

            // Set active flag
            $update = "UPDATE users SET is_active = 1 WHERE id = ?";
            $stmt2 = $mysqli->prepare($update);
            $stmt2->bind_param("i", $user_id);
            $stmt2->execute();
            $stmt2->close();

            // Start Node.js server for admin
            if ($role === 'admin') {
                startNodeJS();
            }

            // Redirect based on role
            if ($role === 'admin') {
                header("Location: adminpanel/indexmain.php");
            } else {
                header("Location: judgepanel/judge.php");
            }
            exit();
        } else {
            header("Location: index.html?error=" . urlencode("Incorrect password!"));
            exit();
        }
    } else {
        header("Location: index.html?error=" . urlencode("Incorrect username!"));
        exit();
    }
    
    $stmt->close();
}

$mysqli->close();
ob_end_flush();
?>