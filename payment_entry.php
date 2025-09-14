<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Entry - Admission Management System</title>
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
                <li><a href="payment_entry.php" class="nav-link active">Payment Entry</a></li>
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
            $payment_id = null;
            
            // Get pre-selected admission from URL
            $preselected_admission = isset($_GET['admission_id']) ? intval($_GET['admission_id']) : null;
            
            if ($_SERVER["REQUEST_METHOD"] == "POST") {
                $admission_id = intval($_POST['admission_id']);
                $amount = floatval($_POST['amount']);
                $payment_date = $_POST['payment_date'];
                $payment_method = $_POST['payment_method'];
                
                // Validation
                if ($admission_id <= 0 || $amount <= 0 || empty($payment_date)) {
                    $error_message = "Please select an admission, enter a valid amount, and payment date.";
                } else {
                    // Get course fees to validate payment
                    $fees_sql = "SELECT c.Fees, COALESCE(SUM(p.Amount), 0) as paid_amount
                                FROM admission a 
                                JOIN course c ON a.Course_ID = c.Course_ID 
                                LEFT JOIN payment p ON a.Admission_ID = p.Admission_ID
                                WHERE a.Admission_ID = ?
                                GROUP BY a.Admission_ID";
                    $fees_stmt = $conn->prepare($fees_sql);
                    $fees_stmt->bind_param("i", $admission_id);
                    $fees_stmt->execute();
                    $fees_result = $fees_stmt->get_result();
                    
                    if ($fees_result->num_rows > 0) {
                        $fees_data = $fees_result->fetch_assoc();
                        $total_fees = $fees_data['Fees'];
                        $paid_amount = $fees_data['paid_amount'];
                        $remaining = $total_fees - $paid_amount;
                        
                        if ($amount > $remaining) {
                            $error_message = "Payment amount (৳ " . number_format($amount, 2) . ") exceeds remaining balance (৳ " . number_format($remaining, 2) . ").";
                        } else {
                            // Insert payment
                            $sql = "INSERT INTO payment (Admission_ID, Amount, Payment_Date, Payment_Method) VALUES (?, ?, ?, ?)";
                            $stmt = $conn->prepare($sql);
                            $stmt->bind_param("idss", $admission_id, $amount, $payment_date, $payment_method);
                            
                            if ($stmt->execute()) {
                                $payment_id = $conn->insert_id;
                                
                                // Update admission payment status
                                $new_paid_amount = $paid_amount + $amount;
                                $new_status = 'Pending';
                                if ($new_paid_amount >= $total_fees) {
                                    $new_status = 'Complete';
                                } elseif ($new_paid_amount > 0) {
                                    $new_status = 'Partial';
                                }
                                
                                $update_sql = "UPDATE admission SET Payment_Status = ? WHERE Admission_ID = ?";
                                $update_stmt = $conn->prepare($update_sql);
                                $update_stmt->bind_param("si", $new_status, $admission_id);
                                $update_stmt->execute();
                                $update_stmt->close();
                                
                                $success = true;
                            } else {
                                $error_message = "Error: " . $conn->error;
                            }
                            $stmt->close();
                        }
                    } else {
                        $error_message = "Invalid admission ID.";
                    }
                    $fees_stmt->close();
                }
            }
            ?>
            
            <!-- Payment Entry Form -->
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">Payment Entry</h1>
                    <p class="card-subtitle">Record student payment for admission</p>
                </div>
                
                <?php if ($success): ?>
                    <div class="alert alert-success">
                        <strong>Success!</strong> Payment recorded successfully with ID: <?php echo $payment_id; ?>
                        <br>
                        <a href="admission_slip.php?id=<?php echo $_POST['admission_id']; ?>" class="btn btn-primary" style="margin-top: 10px;">View Admission Slip</a>
                        <a href="payment_entry.php" class="btn btn-secondary" style="margin-top: 10px;">Add Another Payment</a>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($error_message)): ?>
                    <div class="alert alert-error">
                        <strong>Error!</strong> <?php echo $error_message; ?>
                    </div>
                <?php endif; ?>
                
                <form method="POST" id="paymentForm" onsubmit="return submitFormWithLoading('paymentForm')">
                    <div class="row">
                        <div class="col-md-6">
                            <!-- Admission Selection -->
                            <div class="form-group">
                                <label for="admission_id" class="form-label">Select Admission *</label>
                                <select class="form-control" id="admission_id" name="admission_id" required onchange="loadAdmissionDetails(this.value)">
                                    <option value="">Choose an admission...</option>
                                    <?php
                                    $admissions_sql = "SELECT a.Admission_ID, s.Name as student_name, c.Course_Name, c.Fees, a.Payment_Status,
                                                             COALESCE(SUM(p.Amount), 0) as paid_amount
                                                      FROM admission a 
                                                      JOIN student s ON a.Student_ID = s.Student_ID 
                                                      JOIN course c ON a.Course_ID = c.Course_ID 
                                                      LEFT JOIN payment p ON a.Admission_ID = p.Admission_ID
                                                      WHERE a.Payment_Status != 'Complete'
                                                      GROUP BY a.Admission_ID
                                                      ORDER BY a.Created_Date DESC";
                                    $admissions_result = $conn->query($admissions_sql);
                                    
                                    if ($admissions_result->num_rows > 0) {
                                        while($admission = $admissions_result->fetch_assoc()) {
                                            $balance = $admission['Fees'] - $admission['paid_amount'];
                                            $selected = ($preselected_admission == $admission['Admission_ID']) ? 'selected' : '';
                                            echo "<option value='" . $admission['Admission_ID'] . "' 
                                                         data-fees='" . $admission['Fees'] . "' 
                                                         data-paid='" . $admission['paid_amount'] . "' 
                                                         data-balance='" . $balance . "' $selected>" 
                                                 . htmlspecialchars($admission['student_name']) . " - " 
                                                 . htmlspecialchars($admission['Course_Name']) . " (Balance: ৳ " . number_format($balance, 2) . ")</option>";
                                        }
                                    } else {
                                        echo "<option value=''>No pending payments found</option>";
                                    }
                                    ?>
                                </select>
                            </div>
                            
                            <!-- Amount -->
                            <div class="form-group">
                                <label for="amount" class="form-label">Payment Amount *</label>
                                <input type="number" class="form-control" id="amount" name="amount" required 
                                       step="0.01" min="0" placeholder="Enter payment amount"
                                       onchange="updateBalance()">
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <!-- Admission Details Display -->
                            <div id="admissionDetails" class="form-group" style="display: none;">
                                <div class="card" style="background: #f8f9fa; padding: 15px;">
                                    <h4>Admission Details</h4>
                                    <div id="admissionInfo"></div>
                                    <div id="paymentSummary"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="payment_date" class="form-label">Payment Date *</label>
                                <input type="date" class="form-control" id="payment_date" name="payment_date" required
                                       value="<?php echo date('Y-m-d'); ?>">
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="payment_method" class="form-label">Payment Method *</label>
                                <select class="form-control" id="payment_method" name="payment_method" required>
                                    <option value="">Select payment method...</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Online">Online Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="btn-group">
                        <button type="submit" class="btn btn-primary">Record Payment</button>
                        <button type="reset" class="btn btn-secondary">Clear Form</button>
                        <a href="index.php" class="btn btn-secondary">Back to Dashboard</a>
                    </div>
                </form>
            </div>
            
            <!-- Recent Payments -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Recent Payments</h2>
                    <p class="card-subtitle">Last 15 payment records</p>
                </div>
                
                <div class="search-container">
                    <div class="search-box">
                        <input type="text" id="searchInput" class="search-input" placeholder="Search payments by student name or admission ID...">
                        <button type="button" class="btn btn-primary" onclick="searchRecords()">Search</button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table" id="paymentsTable">
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Admission ID</th>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Amount</th>
                                <th>Payment Date</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $sql = "SELECT p.*, a.Admission_ID, s.Name as student_name, c.Course_Name, a.Payment_Status
                                   FROM payment p 
                                   JOIN admission a ON p.Admission_ID = a.Admission_ID
                                   JOIN student s ON a.Student_ID = s.Student_ID 
                                   JOIN course c ON a.Course_ID = c.Course_ID 
                                   ORDER BY p.Created_Date DESC LIMIT 15";
                            $result = $conn->query($sql);
                            
                            if ($result->num_rows > 0) {
                                while($row = $result->fetch_assoc()) {
                                    echo "<tr>";
                                    echo "<td>" . $row['Payment_ID'] . "</td>";
                                    echo "<td>" . $row['Admission_ID'] . "</td>";
                                    echo "<td>" . htmlspecialchars($row['student_name']) . "</td>";
                                    echo "<td>" . htmlspecialchars($row['Course_Name']) . "</td>";
                                    echo "<td>৳ " . number_format($row['Amount'], 2) . "</td>";
                                    echo "<td>" . date('M d, Y', strtotime($row['Payment_Date'])) . "</td>";
                                    echo "<td>" . $row['Payment_Method'] . "</td>";
                                    echo "<td><span class='status-badge status-" . strtolower($row['Payment_Status']) . "'>" . $row['Payment_Status'] . "</span></td>";
                                    echo "</tr>";
                                }
                            } else {
                                echo "<tr><td colspan='8' style='text-align: center; color: #666;'>No payments found</td></tr>";
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
        function loadAdmissionDetails(admissionId) {
            if (!admissionId) {
                document.getElementById('admissionDetails').style.display = 'none';
                return;
            }
            
            const select = document.getElementById('admission_id');
            const selectedOption = select.options[select.selectedIndex];
            
            if (selectedOption) {
                const fees = parseFloat(selectedOption.dataset.fees);
                const paid = parseFloat(selectedOption.dataset.paid);
                const balance = parseFloat(selectedOption.dataset.balance);
                
                document.getElementById('admissionInfo').innerHTML = `
                    <p><strong>Student:</strong> ${selectedOption.text.split(' - ')[0]}</p>
                    <p><strong>Course:</strong> ${selectedOption.text.split(' - ')[1].split(' (')[0]}</p>
                `;
                
                document.getElementById('paymentSummary').innerHTML = `
                    <hr>
                    <p><strong>Total Fees:</strong> ৳ ${fees.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                    <p><strong>Paid Amount:</strong> ৳ ${paid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                    <p><strong>Remaining Balance:</strong> <span style="color: #dc3545; font-weight: bold;">৳ ${balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                `;
                
                document.getElementById('admissionDetails').style.display = 'block';
                
                // Set max amount
                document.getElementById('amount').max = balance;
            }
        }
        
        function updateBalance() {
            const admissionSelect = document.getElementById('admission_id');
            const amountInput = document.getElementById('amount');
            
            if (admissionSelect.value && amountInput.value) {
                const selectedOption = admissionSelect.options[admissionSelect.selectedIndex];
                const balance = parseFloat(selectedOption.dataset.balance);
                const amount = parseFloat(amountInput.value);
                const newBalance = balance - amount;
                
                if (amount > balance) {
                    amountInput.style.borderColor = '#dc3545';
                    showAlert('Payment amount exceeds remaining balance!', 'error');
                } else {
                    amountInput.style.borderColor = '#28a745';
                    
                    // Update balance display
                    const balanceText = document.querySelector('#paymentSummary p:last-child span');
                    if (balanceText) {
                        balanceText.textContent = `৳ ${newBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
                        balanceText.style.color = newBalance === 0 ? '#28a745' : '#dc3545';
                    }
                }
            }
        }
        
        // Load details if preselected
        document.addEventListener('DOMContentLoaded', function() {
            const admissionSelect = document.getElementById('admission_id');
            
            if (admissionSelect.value) {
                loadAdmissionDetails(admissionSelect.value);
            }
        });
    </script>
</body>
</html>

<?php $conn->close(); ?>
