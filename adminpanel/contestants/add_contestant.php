<?php
require_once '../../db/database.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'];
    $contestant_no = $_POST['contestant_no'];
    $category = $_POST['category'];
    $event_id = $_POST['event_id'];

    // Check for duplicate name in the same event
    $check_name_query = "SELECT * FROM candidates WHERE name = ? AND event_id = ?";
    $stmt_name = $mysqli->prepare($check_name_query);
    $stmt_name->bind_param("si", $name, $event_id);
    $stmt_name->execute();
    $result_name = $stmt_name->get_result();

    if ($result_name->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "A contestant with this name already exists in this event."]);
        exit;
    }
    
    // Check for duplicate contestant number in the same category of the same event
    $check_number_query = "SELECT * FROM candidates WHERE candidate_no = ? AND category = ? AND event_id = ?";
    $stmt_number = $mysqli->prepare($check_number_query);
    $stmt_number->bind_param("isi", $contestant_no, $category, $event_id);
    $stmt_number->execute();
    $result_number = $stmt_number->get_result();

    if ($result_number->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Contestant number is already taken in this category."]);
        exit;
    }

    // Ensure 'uploads' folder exists
    $upload_dir = "upload/";
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $photo_folder = ""; // Default empty value
    if (!empty($_FILES['photo']['name'])) {
        $photo_name = basename($_FILES['photo']['name']);
        $photo_tmp = $_FILES['photo']['tmp_name'];
        $photo_ext = pathinfo($photo_name, PATHINFO_EXTENSION);
        
        // Generate a unique file name
        $photo_folder = $upload_dir . uniqid() . "." . $photo_ext;

        // Move uploaded file
        if (!move_uploaded_file($photo_tmp, $photo_folder)) {
            echo json_encode(["success" => false, "message" => "Failed to upload image."]);
            exit;
        }
    }

    // Insert into database
    $query = "INSERT INTO candidates (candidate_no, name, category, event_id, photo) 
              VALUES (?, ?, ?, ?, ?)";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("issis", $contestant_no, $name, $category, $event_id, $photo_folder);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => $stmt->error]);
    }
    
    $mysqli->close();
}
?>