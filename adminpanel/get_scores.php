<?php
// Include database connection
require_once '../db/database.php';

// Get parameters from request
$eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;
$criteriaId = isset($_GET['criteria_id']) ? intval($_GET['criteria_id']) : 0;

// Query to get scores with candidate and judge information
$sql = "SELECT 
            c.id AS candidate_id,
            c.candidate_no AS candidate_number,
            c.name AS candidate_name,
            c.photo,
            s.judge_id,
            s.score,
            sc.id AS subcriteria_id,
            sc.sub_criteria_name
        FROM 
            candidates c
        LEFT JOIN 
            scores s ON c.id = s.candidate_id AND s.criteria_id = ?
        LEFT JOIN 
            sub_criteria sc ON s.subcriteria_id = sc.id
        WHERE 
            c.event_id = ?
        ORDER BY 
            c.candidate_no, s.judge_id, sc.id";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $criteriaId, $eventId);
$stmt->execute();
$result = $stmt->get_result();

$scores = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $scores[] = $row;
    }
}

// Return as JSON
header('Content-Type: application/json');
echo json_encode($scores);

// Close connection
$stmt->close();
$conn->close();
?>