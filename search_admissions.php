<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Admissions - Admission Management System</title>
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
                <li><a href="search_admissions.php" class="nav-link active">Search Admissions</a></li>
            </ul>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="main-content">
        <div class="container">
            <!-- Page Header -->
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">Search & Filter Admissions</h1>
                    <p class="card-subtitle">Find admission records by various criteria</p>
                </div>
            </div>

            <?php
            require_once 'config/database.php';
            
            // Get search parameters
            $search_term = isset($_GET['search']) ? trim($_GET['search']) : '';
            $status_filter = isset($_GET['status']) ? $_GET['status'] : 'all';
            $course_filter = isset($_GET['course']) ? intval($_GET['course']) : 0;
            $date_from = isset($_GET['date_from']) ? $_GET['date_from'] : '';
            $date_to = isset($_GET['date_to']) ? $_GET['date_to'] : '';
            
            // Build search query
            $where_conditions = [];
            $params = [];
            $param_types = '';
            
            if (!empty($search_term)) {
                $where_conditions[] = "(s.Name LIKE ? OR s.Email LIKE ? OR s.Phone LIKE ? OR CAST(s.Student_ID AS CHAR) LIKE ? OR CAST(a.Admission_ID AS CHAR) LIKE ?)";
                $search_param = "%$search_term%";
                $params = array_merge($params, [$search_param, $search_param, $search_param, $search_param, $search_param]);
                $param_types .= 'sssss';
            }
            
            if ($status_filter !== 'all') {
                $where_conditions[] = "a.Payment_Status = ?";
                $params[] = $status_filter;
                $param_types .= 's';
            }
            
            if ($course_filter > 0) {
                $where_conditions[] = "a.Course_ID = ?";
                $params[] = $course_filter;
                $param_types .= 'i';
            }
            
            if (!empty($date_from)) {
                $where_conditions[] = "a.Admission_Date >= ?";
                $params[] = $date_from;
                $param_types .= 's';
            }
            
            if (!empty($date_to)) {
                $where_conditions[] = "a.Admission_Date <= ?";
                $params[] = $date_to;
                $param_types .= 's';
            }
            
            $where_clause = '';
            if (!empty($where_conditions)) {
                $where_clause = 'WHERE ' . implode(' AND ', $where_conditions);
            }
            
            $sql = "SELECT a.*, s.Name as student_name, s.Email, s.Phone, 
                           c.Course_Name, c.Fees, c.Duration,
                           COALESCE(SUM(p.Amount), 0) as paid_amount,
                           (c.Fees - COALESCE(SUM(p.Amount), 0)) as balance
                    FROM admission a 
                    JOIN student s ON a.Student_ID = s.Student_ID 
                    JOIN course c ON a.Course_ID = c.Course_ID 
                    LEFT JOIN payment p ON a.Admission_ID = p.Admission_ID
                    $where_clause
                    GROUP BY a.Admission_ID
                    ORDER BY a.Created_Date DESC";
            
            if (!empty($params)) {
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($param_types, ...$params);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $conn->query($sql);
            }
            ?>
            
            <!-- Search Form -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Search Filters</h2>
                    <p class="card-subtitle">Use multiple filters to narrow down results</p>
                </div>
                
                <form method="GET" id="searchForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="search" class="form-label">Search Term</label>
                                <input type="text" class="form-control" id="search" name="search" 
                                       placeholder="Student name, email, phone, Student ID, or Admission ID..."
                                       value="<?php echo htmlspecialchars($search_term); ?>">
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="status" class="form-label">Payment Status</label>
                                <select class="form-control" id="status" name="status">
                                    <option value="all" <?php echo ($status_filter === 'all') ? 'selected' : ''; ?>>All Statuses</option>
                                    <option value="Pending" <?php echo ($status_filter === 'Pending') ? 'selected' : ''; ?>>Pending</option>
                                    <option value="Partial" <?php echo ($status_filter === 'Partial') ? 'selected' : ''; ?>>Partial</option>
                                    <option value="Complete" <?php echo ($status_filter === 'Complete') ? 'selected' : ''; ?>>Complete</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="course" class="form-label">Course</label>
                                <select class="form-control" id="course" name="course">
                                    <option value="0">All Courses</option>
                                    <?php
                                    $courses_sql = "SELECT Course_ID, Course_Name FROM course ORDER BY Course_Name";
                                    $courses_result = $conn->query($courses_sql);
                                    
                                    if ($courses_result->num_rows > 0) {
                                        while($course = $courses_result->fetch_assoc()) {
                                            $selected = ($course_filter == $course['Course_ID']) ? 'selected' : '';
                                            echo "<option value='" . $course['Course_ID'] . "' $selected>" . htmlspecialchars($course['Course_Name']) . "</option>";
                                        }
                                    }
                                    ?>
                                </select>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="date_from" class="form-label">Admission Date From</label>
                                <input type="date" class="form-control" id="date_from" name="date_from"
                                       value="<?php echo $date_from; ?>">
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="date_to" class="form-label">Admission Date To</label>
                                <input type="date" class="form-control" id="date_to" name="date_to"
                                       value="<?php echo $date_to; ?>">
                            </div>
                        </div>
                    </div>
                    
                    <div class="btn-group">
                        <button type="submit" class="btn btn-primary">Search</button>
                        <a href="search_admissions.php" class="btn btn-secondary">Clear Filters</a>
                        <button type="button" class="btn btn-info" onclick="exportToCSV('resultsTable', 'admission_records')">Export to CSV</button>
                    </div>
                </form>
            </div>
            
            <!-- Search Results -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Search Results</h2>
                    <p class="card-subtitle">
                        <?php 
                        $total_records = $result->num_rows;
                        echo "Found $total_records admission record(s)";
                        if (!empty($search_term) || $status_filter !== 'all' || $course_filter > 0 || !empty($date_from) || !empty($date_to)) {
                            echo " matching your criteria";
                        }
                        ?>
                    </p>
                </div>
                
                <?php if ($total_records > 0): ?>
                    <div class="table-responsive">
                        <table class="table" id="resultsTable">
                            <thead>
                                <tr>
                                    <th>Admission ID</th>
                                    <th>Student Details</th>
                                    <th>Course</th>
                                    <th>Admission Date</th>
                                    <th>Total Fees</th>
                                    <th>Paid Amount</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                while($row = $result->fetch_assoc()) {
                                    echo "<tr>";
                                    echo "<td><strong>" . $row['Admission_ID'] . "</strong></td>";
                                    echo "<td>";
                                    echo "<strong>" . htmlspecialchars($row['student_name']) . "</strong><br>";
                                    echo "<small>ID: " . $row['Student_ID'] . "</small><br>";
                                    echo "<small>" . htmlspecialchars($row['Email']) . "</small><br>";
                                    echo "<small>" . htmlspecialchars($row['Phone']) . "</small>";
                                    echo "</td>";
                                    echo "<td>";
                                    echo "<strong>" . htmlspecialchars($row['Course_Name']) . "</strong><br>";
                                    echo "<small>Duration: " . htmlspecialchars($row['Duration']) . "</small>";
                                    echo "</td>";
                                    echo "<td>" . date('M d, Y', strtotime($row['Admission_Date'])) . "</td>";
                                    echo "<td>৳ " . number_format($row['Fees'], 2) . "</td>";
                                    echo "<td>৳ " . number_format($row['paid_amount'], 2) . "</td>";
                                    echo "<td>";
                                    if ($row['balance'] > 0) {
                                        echo "<span style='color: #dc3545; font-weight: bold;'>৳ " . number_format($row['balance'], 2) . "</span>";
                                    } else {
                                        echo "<span style='color: #28a745; font-weight: bold;'>৳ 0.00</span>";
                                    }
                                    echo "</td>";
                                    echo "<td><span class='status-badge status-" . strtolower($row['Payment_Status']) . "'>" . $row['Payment_Status'] . "</span></td>";
                                    echo "<td>";
                                    echo "<a href='admission_slip.php?id=" . $row['Admission_ID'] . "' class='btn btn-info btn-small'>View Slip</a> ";
                                    if ($row['Payment_Status'] !== 'Complete') {
                                        echo "<a href='payment_entry.php?admission_id=" . $row['Admission_ID'] . "' class='btn btn-success btn-small'>Add Payment</a>";
                                    }
                                    echo "</td>";
                                    echo "</tr>";
                                }
                                ?>
                            </tbody>
                        </table>
                    </div>
                <?php else: ?>
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <h3>No Records Found</h3>
                        <p>No admission records match your search criteria.</p>
                        <div class="btn-group" style="margin-top: 20px;">
                            <a href="search_admissions.php" class="btn btn-secondary">Clear Filters</a>
                            <a href="admission_form.php" class="btn btn-primary">Create New Admission</a>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- Quick Statistics -->
            <?php if ($total_records > 0): ?>
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Total Records</h3>
                            </div>
                            <div class="stats-number"><?php echo $total_records; ?></div>
                            <div class="stats-label">Matching Records</div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Total Fees</h3>
                            </div>
                            <?php
                            $result->data_seek(0);
                            $total_fees = 0;
                            while($row = $result->fetch_assoc()) {
                                $total_fees += $row['Fees'];
                            }
                            ?>
                            <div class="stats-number">৳ <?php echo number_format($total_fees / 1000, 0) . 'K'; ?></div>
                            <div class="stats-label">Combined Course Fees</div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Payments Collected</h3>
                            </div>
                            <?php
                            $result->data_seek(0);
                            $total_paid = 0;
                            while($row = $result->fetch_assoc()) {
                                $total_paid += $row['paid_amount'];
                            }
                            ?>
                            <div class="stats-number">৳ <?php echo number_format($total_paid / 1000, 0) . 'K'; ?></div>
                            <div class="stats-label">Total Payments</div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>
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

<?php 
if (isset($stmt)) $stmt->close();
$conn->close(); 
?>
