<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Registration - Admission Management System</title>
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
                <li><a href="student_registration.php" class="nav-link active">Student Registration</a></li>
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
            <!-- Alert Container -->
            <div id="alert-container"></div>
            
            <?php
            require_once 'config/database.php';
            
            $success = false;
            $error_message = "";
            
            if ($_SERVER["REQUEST_METHOD"] == "POST") {
                $name = trim($_POST['name']);
                $email = trim($_POST['email']);
                $phone = trim($_POST['phone']);
                $address = trim($_POST['address']);
                $dob = $_POST['dob'];
                
                // Validation
                if (empty($name) || empty($email) || empty($phone) || empty($address) || empty($dob)) {
                    $error_message = "All fields are required.";
                } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $error_message = "Invalid email format.";
                } elseif (!preg_match("/^[0-9]{10}$/", $phone)) {
                    $error_message = "Phone number must be 10 digits.";
                } else {
                    // Check if email already exists
                    $check_sql = "SELECT Student_ID FROM student WHERE Email = ?";
                    $check_stmt = $conn->prepare($check_sql);
                    $check_stmt->bind_param("s", $email);
                    $check_stmt->execute();
                    $check_result = $check_stmt->get_result();
                    
                    if ($check_result->num_rows > 0) {
                        $error_message = "Email already exists. Please use a different email address.";
                    } else {
                        // Insert new student
                        $sql = "INSERT INTO student (Name, Email, Phone, Address, DOB) VALUES (?, ?, ?, ?, ?)";
                        $stmt = $conn->prepare($sql);
                        $stmt->bind_param("sssss", $name, $email, $phone, $address, $dob);
                        
                        if ($stmt->execute()) {
                            $success = true;
                            $student_id = $conn->insert_id;
                        } else {
                            $error_message = "Error: " . $conn->error;
                        }
                        $stmt->close();
                    }
                    $check_stmt->close();
                }
            }
            ?>
            
            <!-- Registration Form -->
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">Student Registration</h1>
                    <p class="card-subtitle">Register a new student in the system</p>
                </div>
                
                <?php if ($success): ?>
                    <div class="alert alert-success">
                        <strong>Success!</strong> Student registered successfully with ID: <?php echo $student_id; ?>
                        <br>
                        <a href="admission_form.php?student_id=<?php echo $student_id; ?>" class="btn btn-primary" style="margin-top: 10px;">Create Admission</a>
                        <a href="student_registration.php" class="btn btn-secondary" style="margin-top: 10px;">Register Another Student</a>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($error_message)): ?>
                    <div class="alert alert-error">
                        <strong>Error!</strong> <?php echo $error_message; ?>
                    </div>
                <?php endif; ?>
                
                <form method="POST" id="studentRegistrationForm" onsubmit="return submitFormWithLoading('studentRegistrationForm')">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="name" class="form-label">Full Name *</label>
                                <input type="text" class="form-control" id="name" name="name" required 
                                       placeholder="Enter student's full name"
                                       value="<?php echo isset($_POST['name']) ? htmlspecialchars($_POST['name']) : ''; ?>">
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="email" class="form-label">Email Address *</label>
                                <input type="email" class="form-control" id="email" name="email" required 
                                       placeholder="Enter email address"
                                       value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="phone" class="form-label">Phone Number *</label>
                                <input type="tel" class="form-control" id="phone" name="phone" required 
                                       placeholder="Enter 10-digit phone number" pattern="[0-9]{10}"
                                       value="<?php echo isset($_POST['phone']) ? htmlspecialchars($_POST['phone']) : ''; ?>">
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="dob" class="form-label">Date of Birth *</label>
                                <input type="date" class="form-control" id="dob" name="dob" required
                                       value="<?php echo isset($_POST['dob']) ? $_POST['dob'] : ''; ?>">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="address" class="form-label">Address *</label>
                        <textarea class="form-control" id="address" name="address" required 
                                  placeholder="Enter complete address" rows="3"><?php echo isset($_POST['address']) ? htmlspecialchars($_POST['address']) : ''; ?></textarea>
                    </div>
                    
                    <div class="btn-group">
                        <button type="submit" class="btn btn-primary">Register Student</button>
                        <button type="reset" class="btn btn-secondary">Clear Form</button>
                        <a href="index.php" class="btn btn-secondary">Back to Dashboard</a>
                    </div>
                </form>
            </div>
            
            <!-- Registered Students List -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Recently Registered Students</h2>
                    <p class="card-subtitle">Last 10 registered students</p>
                </div>
                
                <div class="search-container">
                    <div class="search-box">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search students by name, email, or phone...">
                        <button type="button" class="btn btn-primary" onclick="searchRecords()">Search</button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table" id="studentsTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Date of Birth</th>
                                <th>Registration Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $sql = "SELECT * FROM student ORDER BY Created_Date DESC LIMIT 10";
                            $result = $conn->query($sql);
                            
                            if ($result->num_rows > 0) {
                                while($row = $result->fetch_assoc()) {
                                    echo "<tr>";
                                    echo "<td>" . $row['Student_ID'] . "</td>";
                                    echo "<td>" . htmlspecialchars($row['Name']) . "</td>";
                                    echo "<td>" . htmlspecialchars($row['Email']) . "</td>";
                                    echo "<td>" . htmlspecialchars($row['Phone']) . "</td>";
                                    echo "<td>" . date('M d, Y', strtotime($row['DOB'])) . "</td>";
                                    echo "<td>" . date('M d, Y', strtotime($row['Created_Date'])) . "</td>";
                                    echo "<td>";
                                    echo "<a href='admission_form.php?student_id=" . $row['Student_ID'] . "' class='btn btn-success btn-small'>Create Admission</a> ";
                                    echo "<a href='view_student.php?id=" . $row['Student_ID'] . "' class='btn btn-info btn-small'>View Details</a>";
                                    echo "</td>";
                                    echo "</tr>";
                                }
                            } else {
                                echo "<tr><td colspan='7' style='text-align: center; color: #666;'>No students found</td></tr>";
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
</body>
</html>

<?php $conn->close(); ?>
