<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$course_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($course_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid course ID']);
    exit;
}

$sql = "SELECT c.*, d.Dept_Name FROM course c LEFT JOIN department d ON c.Dept_ID = d.Dept_ID WHERE c.Course_ID = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $course_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $course = $result->fetch_assoc();
    echo json_encode(['success' => true, 'course' => $course]);
} else {
    echo json_encode(['success' => false, 'message' => 'Course not found']);
}

$stmt->close();
$conn->close();
?>
