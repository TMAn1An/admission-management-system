<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Admission - Admission Management System</title>
    <link rel="stylesheet" href="css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <a href="index.php" class="nav-brand">🎓 Admission Management</a>
            <ul class="nav-menu">
                <li><a href="index.php" class="nav-link">Dashboard</a></li>
                <li><a href="student_registration.php" class="nav-link">Student Registration</a></li>
                <li><a href="courses.php" class="nav-link">Courses</a></li>
                <li><a href="admission_form.php" class="nav-link active">New Admission</a></li>
                <li><a href="payment_entry.php" class="nav-link">Payment Entry</a></li>
                <li><a href="search_admissions.php" class="nav-link">Search Admissions</a></li>
            </ul>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="main-content">
        <div class="container">
            <!-- Alert Container -->
            <div id="alert-container"></div>
            
            <?php
            require_once 'config/database.php';
            
            $success = false;
            $error_message = "";
            $admission_id = null;
            
            // Get pre-selected student or course from URL
            $preselected_student = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
            $preselected_course = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
            
            if ($_SERVER["REQUEST_METHOD"] == "POST") {
                $student_id = intval($_POST['student_id']);
                $course_id = intval($_POST['course_id']);
                $admission_date = $_POST['admission_date'];
                $payment_status = $_POST['payment_status'];
                
                // Validation
                if ($student_id <= 0 || $course_id <= 0 || empty($admission_date)) {
                    $error_message = "Please select a student, course, and admission date.";
                } else {
                    // Check if student is already admitted to this course
                    $check_sql = "SELECT Admission_ID FROM admission WHERE Student_ID = ? AND Course_ID = ?";
                    $check_stmt = $conn->prepare($check_sql);
                    $check_stmt->bind_param("ii", $student_id, $course_id);
                    $check_stmt->execute();
                    $check_result = $check_stmt->get_result();
                    
                    if ($check_result->num_rows > 0) {
                        $error_message = "This student is already admitted to the selected course.";
                    } else {
                        // Insert new admission
                        $sql = "INSERT INTO admission (Student_ID, Course_ID, Admission_Date, Payment_Status) VALUES (?, ?, ?, ?)";
                        $stmt = $conn->prepare($sql);
                        $stmt->bind_param("iiss", $student_id, $course_id, $admission_date, $payment_status);
                        
                        if ($stmt->execute()) {
                            $success = true;
                            $admission_id = $conn->insert_id;
                        } else {
                            $error_message = "Error: " . $conn->error;
                        }
                        $stmt->close();
                    }
                    $check_stmt->close();
                }
            }
            ?>
            
            <!-- Admission Form -->
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">Create New Admission</h1>
                    <p class="card-subtitle">Assign a student to a course</p>
                </div>
                
                <?php if ($success): ?>
                    <div class="alert alert-success">
                        <strong>Success!</strong> Admission created successfully with ID: <?php echo $admission_id; ?>
                        <br>
                        <a href="admission_slip.php?id=<?php echo $admission_id; ?>" class="btn btn-primary" style="margin-top: 10px;">View Admission Slip</a>
                        <a href="payment_entry.php?admission_id=<?php echo $admission_id; ?>" class="btn btn-success" style="margin-top: 10px;">Add Payment</a>
                        <a href="admission_form.php" class="btn btn-secondary" style="margin-top: 10px;">Create Another Admission</a>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($error_message)): ?>
                    <div class="alert alert-error">
                        <strong>Error!</strong> <?php echo $error_message; ?>
                    </div>
                <?php endif; ?>
                
                <form method="POST" id="admissionForm" onsubmit="return submitFormWithLoading('admissionForm')">
                    <div class="row">
                        <div class="col-md-6">
                            <!-- Student Selection -->
                            <div class="form-group">
                                <label for="student_id" class="form-label">Select Student *</label>
                                <select class="form-control" id="student_id" name="student_id" required onchange="loadStudentDetails(this.value)">
                                    <option value="">Choose a student...</option>
                                    <?php
                                    $students_sql = "SELECT Student_ID, Name, Email FROM student ORDER BY Name";
                                    $students_result = $conn->query($students_sql);
                                    
                                    if ($students_result->num_rows > 0) {
                                        while($student = $students_result->fetch_assoc()) {
                                            $selected = ($preselected_student == $student['Student_ID']) ? 'selected' : '';
                                            echo "<option value='" . $student['Student_ID'] . "' $selected>" . htmlspecialchars($student['Name']) . " - " . htmlspecialchars($student['Email']) . "</option>";
                                        }
                                    }
                                    ?>
                                </select>
                            </div>
                            
                            <!-- Student Details Display -->
                            <div id="studentDetails" class="form-group" style="display: none;">
                                <div class="card" style="background: #f8f9fa; padding: 15px;">
                                    <h4>Student Details</h4>
                                    <div id="studentInfo"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <!-- Course Selection -->
                            <div class="form-group">
                                <label for="course_id" class="form-label">Select Course *</label>
                                <select class="form-control" id="course_id" name="course_id" required onchange="loadCourseDetails(this.value)">
                                    <option value="">Choose a course...</option>
                                    <?php
                                    $courses_sql = "SELECT c.Course_ID, c.Course_Name, c.Fees, c.Duration, d.Dept_Name 
                                                   FROM course c 
                                                   LEFT JOIN department d ON c.Dept_ID = d.Dept_ID 
                                                   ORDER BY c.Course_Name";
                                    $courses_result = $conn->query($courses_sql);
                                    
                                    if ($courses_result->num_rows > 0) {
                                        while($course = $courses_result->fetch_assoc()) {
                                            $selected = ($preselected_course == $course['Course_ID']) ? 'selected' : '';
                                            echo "<option value='" . $course['Course_ID'] . "' data-fees='" . $course['Fees'] . "' $selected>" 
                                                 . htmlspecialchars($course['Course_Name']) . " - ৳ " . number_format($course['Fees'], 2) . "</option>";
                                        }
                                    }
                                    ?>
                                </select>
                            </div>
                            
                            <!-- Course Details Display -->
                            <div id="courseDetails" class="form-group" style="display: none;">
                                <div class="card" style="background: #f8f9fa; padding: 15px;">
                                    <h4>Course Details</h4>
                                    <div id="courseInfo"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="admission_date" class="form-label">Admission Date *</label>
                                <input type="date" class="form-control" id="admission_date" name="admission_date" required
                                       value="<?php echo date('Y-m-d'); ?>">
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="payment_status" class="form-label">Initial Payment Status *</label>
                                <select class="form-control" id="payment_status" name="payment_status" required>
                                    <option value="Pending">Pending</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Complete">Complete</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="btn-group">
                        <button type="submit" class="btn btn-primary">Create Admission</button>
                        <button type="reset" class="btn btn-secondary">Clear Form</button>
                        <a href="index.php" class="btn btn-secondary">Back to Dashboard</a>
                    </div>
                </form>
            </div>
            
            <!-- Recent Admissions -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Recent Admissions</h2>
                    <p class="card-subtitle">Last 10 admission records</p>
                </div>
                
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Admission ID</th>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Admission Date</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $sql = "SELECT a.*, s.Name as student_name, c.Course_Name, c.Fees 
                                   FROM admission a 
                                   JOIN student s ON a.Student_ID = s.Student_ID 
                                   JOIN course c ON a.Course_ID = c.Course_ID 
                                   ORDER BY a.Created_Date DESC LIMIT 10";
                            $result = $conn->query($sql);
                            
                            if ($result->num_rows > 0) {
                                while($row = $result->fetch_assoc()) {
                                    echo "<tr>";
                                    echo "<td>" . $row['Admission_ID'] . "</td>";
                                    echo "<td>" . htmlspecialchars($row['student_name']) . "</td>";
                                    echo "<td>" . htmlspecialchars($row['Course_Name']) . "</td>";
                                    echo "<td>" . date('M d, Y', strtotime($row['Admission_Date'])) . "</td>";
                                    echo "<td><span class='status-badge status-" . strtolower($row['Payment_Status']) . "'>" . $row['Payment_Status'] . "</span></td>";
                                    echo "<td>";
                                    echo "<a href='admission_slip.php?id=" . $row['Admission_ID'] . "' class='btn btn-info btn-small'>View Slip</a> ";
                                    echo "<a href='payment_entry.php?admission_id=" . $row['Admission_ID'] . "' class='btn btn-success btn-small'>Add Payment</a>";
                                    echo "</td>";
                                    echo "</tr>";
                                }
                            } else {
                                echo "<tr><td colspan='6' style='text-align: center; color: #666;'>No admissions found</td></tr>";
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <p class="footer-text">© 2025 Admission Management System</p>
        </div>
    </footer>

    <script src="js/script.js"></script>
    
    <script>
        function loadStudentDetails(studentId) {
            if (!studentId) {
                document.getElementById('studentDetails').style.display = 'none';
                return;
            }
            
            // Fetch student details via AJAX
            fetch('ajax/get_student_details.php?id=' + studentId)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const student = data.student;
                        document.getElementById('studentInfo').innerHTML = `
                            <p><strong>Name:</strong> ${student.Name}</p>
                            <p><strong>Email:</strong> ${student.Email}</p>
                            <p><strong>Phone:</strong> ${student.Phone}</p>
                            <p><strong>Date of Birth:</strong> ${new Date(student.DOB).toLocaleDateString()}</p>
                        `;
                        document.getElementById('studentDetails').style.display = 'block';
                    }
                })
                .catch(error => console.error('Error:', error));
        }
        
        function loadCourseDetails(courseId) {
            if (!courseId) {
                document.getElementById('courseDetails').style.display = 'none';
                return;
            }
            
            // Fetch course details via AJAX
            fetch('ajax/get_course_details.php?id=' + courseId)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const course = data.course;
                        document.getElementById('courseInfo').innerHTML = `
                            <p><strong>Course:</strong> ${course.Course_Name}</p>
                            <p><strong>Department:</strong> ${course.Dept_Name || 'N/A'}</p>
                            <p><strong>Duration:</strong> ${course.Duration}</p>
                            <p><strong>Fees:</strong> ৳ ${parseFloat(course.Fees).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                        `;
                        document.getElementById('courseDetails').style.display = 'block';
                    }
                })
                .catch(error => console.error('Error:', error));
        }
        
        // Load details if preselected
        document.addEventListener('DOMContentLoaded', function() {
            const studentSelect = document.getElementById('student_id');
            const courseSelect = document.getElementById('course_id');
            
            if (studentSelect.value) {
                loadStudentDetails(studentSelect.value);
            }
            
            if (courseSelect.value) {
                loadCourseDetails(courseSelect.value);
            }
        });
    </script>
</body>
</html>

<?php $conn->close(); ?>
