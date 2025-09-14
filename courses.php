<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Courses - Admission Management System</title>
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
                <li><a href="courses.php" class="nav-link active">Courses</a></li>
                <li><a href="admission_form.php" class="nav-link">New Admission</a></li>
                <li><a href="payment_entry.php" class="nav-link">Payment Entry</a></li>
                <li><a href="search_admissions.php" class="nav-link">Search Admissions</a></li>
            </ul>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="main-content">
        <div class="container">
            <!-- Page Header -->
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">Available Courses</h1>
                    <p class="card-subtitle">Browse through our comprehensive course offerings</p>
                </div>
            </div>

            <?php
            require_once 'config/database.php';
            
            // Get all courses with department information
            $sql = "SELECT c.*, d.Dept_Name, d.Dept_Head 
                   FROM course c 
                   LEFT JOIN department d ON c.Dept_ID = d.Dept_ID 
                   ORDER BY d.Dept_Name, c.Course_Name";
            $result = $conn->query($sql);
            ?>

            <!-- Course Statistics -->
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Total Courses</h3>
                        </div>
                        <?php
                        $count_result = $conn->query("SELECT COUNT(*) as count FROM course");
                        $course_count = $count_result->fetch_assoc()['count'];
                        ?>
                        <div class="stats-number"><?php echo $course_count; ?></div>
                        <div class="stats-label">Available Courses</div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Departments</h3>
                        </div>
                        <?php
                        $dept_result = $conn->query("SELECT COUNT(*) as count FROM department");
                        $dept_count = $dept_result->fetch_assoc()['count'];
                        ?>
                        <div class="stats-number"><?php echo $dept_count; ?></div>
                        <div class="stats-label">Active Departments</div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Enrollments</h3>
                        </div>
                        <?php
                        $enroll_result = $conn->query("SELECT COUNT(*) as count FROM admission");
                        $enroll_count = $enroll_result->fetch_assoc()['count'];
                        ?>
                        <div class="stats-number"><?php echo $enroll_count; ?></div>
                        <div class="stats-label">Total Enrollments</div>
                    </div>
                </div>
            </div>

            <!-- Course Cards Grid -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Course Catalog</h2>
                    <p class="card-subtitle">Click on any course to create an admission</p>
                </div>
                
                <div class="course-grid">
                    <?php
                    if ($result->num_rows > 0) {
                        while($row = $result->fetch_assoc()) {
                            // Get enrollment count for this course
                            $enroll_sql = "SELECT COUNT(*) as count FROM admission WHERE Course_ID = " . $row['Course_ID'];
                            $enroll_result = $conn->query($enroll_sql);
                            $enrollment_count = $enroll_result->fetch_assoc()['count'];
                            
                            echo "<div class='course-card'>";
                            echo "<div class='course-name'>" . htmlspecialchars($row['Course_Name']) . "</div>";
                            echo "<div class='course-details'>";
                            echo "<strong>Department:</strong> " . ($row['Dept_Name'] ? htmlspecialchars($row['Dept_Name']) : 'N/A') . "<br>";
                            echo "<strong>Duration:</strong> " . htmlspecialchars($row['Duration']) . "<br>";
                            echo "<strong>Enrolled Students:</strong> " . $enrollment_count;
                            echo "</div>";
                            echo "<div class='course-fee'>৳ " . number_format($row['Fees'], 2) . "</div>";
                            echo "<div class='btn-group'>";
                            echo "<a href='admission_form.php?course_id=" . $row['Course_ID'] . "' class='btn btn-primary btn-small'>Create Admission</a>";
                            echo "<a href='course_details.php?id=" . $row['Course_ID'] . "' class='btn btn-info btn-small'>View Details</a>";
                            echo "</div>";
                            echo "</div>";
                        }
                    } else {
                        echo "<p style='text-align: center; color: #666; grid-column: 1 / -1;'>No courses found.</p>";
                    }
                    ?>
                </div>
            </div>

            <!-- Course Table View -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Course Details Table</h2>
                    <p class="card-subtitle">Detailed view of all courses</p>
                </div>
                
                <div class="search-container">
                    <div class="search-box">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search courses by name or department...">
                        <button type="button" class="btn btn-primary" onclick="searchRecords()">Search</button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table" id="coursesTable">
                        <thead>
                            <tr>
                                <th>Course ID</th>
                                <th>Course Name</th>
                                <th>Department</th>
                                <th>Duration</th>
                                <th>Fees</th>
                                <th>Enrollments</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            // Reset result pointer
                            $result->data_seek(0);
                            
                            if ($result->num_rows > 0) {
                                while($row = $result->fetch_assoc()) {
                                    // Get enrollment count for this course
                                    $enroll_sql = "SELECT COUNT(*) as count FROM admission WHERE Course_ID = " . $row['Course_ID'];
                                    $enroll_result = $conn->query($enroll_sql);
                                    $enrollment_count = $enroll_result->fetch_assoc()['count'];
                                    
                                    echo "<tr>";
                                    echo "<td>" . $row['Course_ID'] . "</td>";
                                    echo "<td>" . htmlspecialchars($row['Course_Name']) . "</td>";
                                    echo "<td>" . ($row['Dept_Name'] ? htmlspecialchars($row['Dept_Name']) : 'N/A') . "</td>";
                                    echo "<td>" . htmlspecialchars($row['Duration']) . "</td>";
                                    echo "<td>৳ " . number_format($row['Fees'], 2) . "</td>";
                                    echo "<td>" . $enrollment_count . "</td>";
                                    echo "<td>";
                                    echo "<a href='admission_form.php?course_id=" . $row['Course_ID'] . "' class='btn btn-success btn-small'>New Admission</a> ";
                                    echo "<a href='course_enrollments.php?id=" . $row['Course_ID'] . "' class='btn btn-info btn-small'>View Enrollments</a>";
                                    echo "</td>";
                                    echo "</tr>";
                                }
                            } else {
                                echo "<tr><td colspan='7' style='text-align: center; color: #666;'>No courses found</td></tr>";
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Department Information -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Departments</h2>
                    <p class="card-subtitle">Our academic departments</p>
                </div>
                
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Department Head</th>
                                <th>Total Courses</th>
                                <th>Total Enrollments</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $dept_sql = "SELECT d.*, 
                                               COUNT(DISTINCT c.Course_ID) as course_count,
                                               COUNT(DISTINCT a.Admission_ID) as enrollment_count
                                        FROM department d
                                        LEFT JOIN course c ON d.Dept_ID = c.Dept_ID
                                        LEFT JOIN admission a ON c.Course_ID = a.Course_ID
                                        GROUP BY d.Dept_ID
                                        ORDER BY d.Dept_Name";
                            $dept_result = $conn->query($dept_sql);
                            
                            if ($dept_result->num_rows > 0) {
                                while($row = $dept_result->fetch_assoc()) {
                                    echo "<tr>";
                                    echo "<td>" . htmlspecialchars($row['Dept_Name']) . "</td>";
                                    echo "<td>" . ($row['Dept_Head'] ? htmlspecialchars($row['Dept_Head']) : 'N/A') . "</td>";
                                    echo "<td>" . $row['course_count'] . "</td>";
                                    echo "<td>" . $row['enrollment_count'] . "</td>";
                                    echo "</tr>";
                                }
                            } else {
                                echo "<tr><td colspan='4' style='text-align: center; color: #666;'>No departments found</td></tr>";
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Quick Actions</h2>
                    <p class="card-subtitle">Perform common course-related tasks</p>
                </div>
                
                <div class="btn-group">
                    <a href="admission_form.php" class="btn btn-primary">Create New Admission</a>
                    <a href="student_registration.php" class="btn btn-success">Register Student</a>
                    <a href="search_admissions.php" class="btn btn-info">Search Admissions</a>
                    <a href="index.php" class="btn btn-secondary">Back to Dashboard</a>
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
    
    <style>
        .stats-number {
            font-size: 48px;
            font-weight: 700;
            color: #667eea;
            text-align: center;
            margin: 20px 0 10px 0;
        }
        
        .stats-label {
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</body>
</html>

<?php $conn->close(); ?>
