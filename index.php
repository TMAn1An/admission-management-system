<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admission Management System - DBMS Project</title>
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
                <li><a href="admission_form.php" class="nav-link">New Admission</a></li>
                <li><a href="payment_entry.php" class="nav-link">Payment Entry</a></li>
                <li><a href="search_admissions.php" class="nav-link">Search Admissions</a></li>
            </ul>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="main-content">
        <div class="container">
            <!-- Welcome Section -->
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">Welcome to Admission Management System</h1>
                    <p class="card-subtitle">A comprehensive solution for managing student admissions, courses, and payments</p>
                </div>
                
                <div class="row">
                    <div class="col-md-12">
                        <p>This system helps educational institutions manage their admission process efficiently. You can register new students, manage courses, process admissions, handle payments, and generate reports.</p>
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Total Students</h3>
                        </div>
                        <?php
                        require_once 'config/database.php';
                        $result = $conn->query("SELECT COUNT(*) as count FROM student");
                        $student_count = $result->fetch_assoc()['count'];
                        ?>
                        <div class="stats-number"><?php echo $student_count; ?></div>
                        <div class="stats-label">Registered Students</div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Active Courses</h3>
                        </div>
                        <?php
                        $result = $conn->query("SELECT COUNT(*) as count FROM course");
                        $course_count = $result->fetch_assoc()['count'];
                        ?>
                        <div class="stats-number"><?php echo $course_count; ?></div>
                        <div class="stats-label">Available Courses</div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Total Admissions</h3>
                        </div>
                        <?php
                        $result = $conn->query("SELECT COUNT(*) as count FROM admission");
                        $admission_count = $result->fetch_assoc()['count'];
                        ?>
                        <div class="stats-number"><?php echo $admission_count; ?></div>
                        <div class="stats-label">Processed Admissions</div>
                    </div>
                </div>
            </div>

            <!-- Recent Activities -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Recent Admissions</h2>
                    <p class="card-subtitle">Latest admission records</p>
                </div>
                
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Admission Date</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $sql = "SELECT a.*, s.Name as student_name, c.Course_Name 
                                   FROM admission a 
                                   JOIN student s ON a.Student_ID = s.Student_ID 
                                   JOIN course c ON a.Course_ID = c.Course_ID 
                                   ORDER BY a.Created_Date DESC LIMIT 5";
                            $result = $conn->query($sql);
                            
                            if ($result->num_rows > 0) {
                                while($row = $result->fetch_assoc()) {
                                    echo "<tr>";
                                    echo "<td>" . htmlspecialchars($row['student_name']) . "</td>";
                                    echo "<td>" . htmlspecialchars($row['Course_Name']) . "</td>";
                                    echo "<td>" . date('M d, Y', strtotime($row['Admission_Date'])) . "</td>";
                                    echo "<td><span class='status-badge status-" . strtolower($row['Payment_Status']) . "'>" . $row['Payment_Status'] . "</span></td>";
                                    echo "<td>";
                                    echo "<a href='admission_slip.php?id=" . $row['Admission_ID'] . "' class='btn btn-info btn-small'>View Slip</a>";
                                    echo "</td>";
                                    echo "</tr>";
                                }
                            } else {
                                echo "<tr><td colspan='5' style='text-align: center; color: #666;'>No admissions found</td></tr>";
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
                    <p class="card-subtitle">Common tasks and shortcuts</p>
                </div>
                
                <div class="btn-group">
                    <a href="student_registration.php" class="btn btn-primary">Register New Student</a>
                    <a href="admission_form.php" class="btn btn-success">New Admission</a>
                    <a href="payment_entry.php" class="btn btn-info">Add Payment</a>
                    <a href="search_admissions.php" class="btn btn-secondary">Search Records</a>
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
