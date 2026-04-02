<?php
require_once '../../db/database.php';
header('Content-Type: application/json');

try {
    $query = "SELECT 
                e.id AS event_id, 
                e.event_name, 
                c.id AS criteria_id, 
                c.criteria_name, 
                c.min_score AS criteria_min_score,
                c.max_score AS criteria_max_score,
                c.percentage AS criteria_percentage,
                c.weight AS criteria_weight,
                c.round_type,
                s.id AS sub_criteria_id, 
                s.sub_criteria_name,
                s.min_score AS sub_criteria_min_score,
                s.max_score AS sub_criteria_max_score,
                s.percentage AS sub_criteria_percentage
              FROM events e
              LEFT JOIN criteria c ON e.id = c.event_id
              LEFT JOIN sub_criteria s ON c.id = s.criteria_id
              ORDER BY e.id DESC, c.round_type, c.id ASC, s.id ASC";
    
    $result = $mysqli->query($query);
    
    if (!$result) {
        throw new Exception("Database query failed: " . $mysqli->error);
    }
    
    $events = [];
    
    while ($row = $result->fetch_assoc()) {
        $eventId = $row['event_id'];
        $criteriaId = $row['criteria_id'];
        $subCriteriaId = $row['sub_criteria_id'];
        $roundType = $row['round_type'] ?: 'regular';
        
        // Initialize event if not exists
        if (!isset($events[$eventId])) {
            $events[$eventId] = [
                "id" => $eventId,
                "name" => $row['event_name'],
                "criteria" => [],
                "round_criteria" => []
            ];
        }
        
        // Handle criteria based on round type
        if ($criteriaId) {
            $criteriaData = [
                "id" => $criteriaId,
                "name" => $row['criteria_name'],
                "min_score" => $row['criteria_min_score'],
                "max_score" => $row['criteria_max_score'],
                "percentage" => $row['criteria_percentage'],
                "weight" => $row['criteria_weight'],
                "sub_criteria" => []
            ];
            
            // Add sub-criteria if it exists
            if ($subCriteriaId) {
                $criteriaData['sub_criteria'][] = [
                    "id" => $subCriteriaId,
                    "name" => $row['sub_criteria_name'],
                    "min_score" => $row['sub_criteria_min_score'],
                    "max_score" => $row['sub_criteria_max_score'],
                    "percentage" => $row['sub_criteria_percentage']
                ];
            }
            
            // Add to appropriate section based on round type
            if ($roundType === 'regular') {
                if (!isset($events[$eventId]['criteria'][$criteriaId])) {
                    $events[$eventId]['criteria'][$criteriaId] = $criteriaData;
                } else if ($subCriteriaId) {
                    $events[$eventId]['criteria'][$criteriaId]['sub_criteria'][] = [
                        "id" => $subCriteriaId,
                        "name" => $row['sub_criteria_name'],
                        "min_score" => $row['sub_criteria_min_score'],
                        "max_score" => $row['sub_criteria_max_score'],
                        "percentage" => $row['sub_criteria_percentage']
                    ];
                }
            } else {
                // Round criteria
                if (!isset($events[$eventId]['round_criteria'][$roundType])) {
                    $events[$eventId]['round_criteria'][$roundType] = [
                        "round_type" => $roundType,
                        "criteria" => []
                    ];
                }
                
                if (!isset($events[$eventId]['round_criteria'][$roundType]['criteria'][$criteriaId])) {
                    $events[$eventId]['round_criteria'][$roundType]['criteria'][$criteriaId] = $criteriaData;
                } else if ($subCriteriaId) {
                    $events[$eventId]['round_criteria'][$roundType]['criteria'][$criteriaId]['sub_criteria'][] = [
                        "id" => $subCriteriaId,
                        "name" => $row['sub_criteria_name'],
                        "min_score" => $row['sub_criteria_min_score'],
                        "max_score" => $row['sub_criteria_max_score'],
                        "percentage" => $row['sub_criteria_percentage']
                    ];
                }
            }
        }
    }
    
    // Convert associative arrays to indexed arrays
    foreach ($events as &$event) {
        $event['criteria'] = array_values($event['criteria']);
        
        // Convert round_criteria to indexed array
        $event['round_criteria'] = array_values($event['round_criteria']);
        foreach ($event['round_criteria'] as &$round) {
            $round['criteria'] = array_values($round['criteria']);
        }
    }
    
    // Convert events to indexed array
    $eventsArray = array_values($events);
    
    // Output JSON
    echo json_encode($eventsArray, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Return error
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$mysqli->close();
?>