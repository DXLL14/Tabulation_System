<?php
// Increase execution time limit for large databases
set_time_limit(30);

// Disable output buffering to send response faster
if (ob_get_level()) ob_end_clean();

header('Content-Type: application/json');

require_once '../../db/database.php';

try {
    // Optimize connection for faster operations
    $mysqli->query("SET autocommit=0");
    $mysqli->query("SET unique_checks=0");
    $mysqli->query("SET foreign_key_checks=0");

    // Start transaction
    $mysqli->begin_transaction();

    try {
        // Data tables to truncate (in correct order to avoid foreign key issues)
        $tables = [
            "scores",
            "selected_data", 
            "sub_criteria",
            "criteria",
            "candidates",
            "events"
        ];

        // Reset should_refresh table
        $resetQuery = "UPDATE should_refresh SET value = 0 WHERE id = 1";
        if (!$mysqli->query($resetQuery)) {
            throw new Exception("Error resetting should_refresh: " . $mysqli->error);
        }

        // Truncate all data tables - this will reset auto_increment values
        foreach ($tables as $table) {
            $query = "TRUNCATE TABLE `$table`";
            if (!$mysqli->query($query)) {
                throw new Exception("Error truncating $table: " . $mysqli->error);
            }
        }
        
        // Delete all judge users but keep admin users
        $deleteJudgesQuery = "DELETE FROM users WHERE role = 'judge'";
        if (!$mysqli->query($deleteJudgesQuery)) {
            throw new Exception("Error deleting judge accounts: " . $mysqli->error);
        }

        // Explicitly reset auto_increment for users table to next available number
        // Get the maximum admin user ID and set auto_increment to one higher
        $maxIdQuery = "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM users WHERE role = 'admin'";
        $result = $mysqli->query($maxIdQuery);
        if ($result) {
            $row = $result->fetch_assoc();
            $nextId = $row['next_id'];
            $resetAutoIncrement = "ALTER TABLE users AUTO_INCREMENT = $nextId";
            $mysqli->query($resetAutoIncrement);
        }

        // Commit transaction
        $mysqli->commit();

        // Re-enable checks
        $mysqli->query("SET unique_checks=1");
        $mysqli->query("SET foreign_key_checks=1");
        $mysqli->query("SET autocommit=1");

        // Send success response immediately
        echo json_encode([
            'success' => true, 
            'message' => 'All data and judge accounts cleared successfully. Auto-increment IDs reset to 1.'
        ]);
        
        // Flush output to ensure response is sent
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        } else {
            flush();
        }

    } catch (Exception $e) {
        // Rollback transaction on error
        $mysqli->rollback();
        
        $mysqli->query("SET unique_checks=1");
        $mysqli->query("SET foreign_key_checks=1");
        $mysqli->query("SET autocommit=1");
        
        throw $e;
    }

    // Close connection
    $mysqli->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
}
?>