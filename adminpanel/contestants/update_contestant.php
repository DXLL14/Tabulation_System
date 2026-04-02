<?php
header('Content-Type: application/json');
require_once '../../db/database.php';

$response = ['success' => false, 'message' => 'Unknown error'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitize inputs
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $name = trim($_POST['name']);
    $contestant_no = trim($_POST['contestant_no']);
    $category = trim($_POST['category']);
    $event_id = intval($_POST['event_id']);

    if (!$id || !$name || !$contestant_no || !$category || !$event_id) {
        $response['message'] = 'Missing required fields.';
        echo json_encode($response);
        exit;
    }

    // Check for duplicate name in the same event (excluding current contestant)
    $check_name_query = "SELECT id FROM candidates WHERE name = ? AND event_id = ? AND id != ?";
    $stmt_name = $mysqli->prepare($check_name_query);
    $stmt_name->bind_param("sii", $name, $event_id, $id);
    $stmt_name->execute();
    $result_name = $stmt_name->get_result();
    
    if ($result_name->num_rows > 0) {
        $response['message'] = 'A contestant with this name already exists in this event.';
        echo json_encode($response);
        exit;
    }
    $stmt_name->close();
    
    // Check for duplicate contestant number in the same category of the same event (excluding current contestant)
    $check_number_query = "SELECT id FROM candidates WHERE candidate_no = ? AND category = ? AND event_id = ? AND id != ?";
    $stmt_number = $mysqli->prepare($check_number_query);
    $stmt_number->bind_param("ssii", $contestant_no, $category, $event_id, $id);
    $stmt_number->execute();
    $result_number = $stmt_number->get_result();
    
    if ($result_number->num_rows > 0) {
        $response['message'] = 'Contestant number is already taken in this category.';
        echo json_encode($response);
        exit;
    }
    $stmt_number->close();

    // Optional photo update
    $photoUpdated = false;
    $photoFilename = '';

    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'upload/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $tmpName = $_FILES['photo']['tmp_name'];
        $originalName = basename($_FILES['photo']['name']);
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $photoFilename = uniqid('', true) . '.' . $extension;
        $targetPath = $uploadDir . $photoFilename;

        if (move_uploaded_file($tmpName, $targetPath)) {
            $photoFilename = $uploadDir . $photoFilename;
            $photoUpdated = true;
        } else {
            $response['message'] = 'Failed to upload photo.';
            echo json_encode($response);
            exit;
        }
    }

    try {
        if ($photoUpdated) {
            $sql = "UPDATE candidates 
                    SET name = ?, candidate_no = ?, category = ?, event_id = ?, photo = ? 
                    WHERE id = ?";
            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param("sssisi", $name, $contestant_no, $category, $event_id, $photoFilename, $id);
        } else {
            $sql = "UPDATE candidates 
                    SET name = ?, candidate_no = ?, category = ?, event_id = ? 
                    WHERE id = ?";
            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param("ssiii", $name, $contestant_no, $category, $event_id, $id);
        }

        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = 'Contestant updated successfully.';
        } else {
            $response['message'] = 'Database error: ' . $stmt->error;
        }

        $stmt->close();
    } catch (Exception $e) {
        $response['message'] = 'Exception: ' . $e->getMessage();
    }

    $mysqli->close();
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
?>