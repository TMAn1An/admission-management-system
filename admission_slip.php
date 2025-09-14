<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admission Confirmation Slip - Admission Management System</title>
    <link rel="stylesheet" href="css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Navigation (hidden in print) -->
    <nav class="navbar no-print">
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
            <?php
            require_once 'config/database.php';
            
            $admission_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            
            if ($admission_id <= 0) {
                echo "<div class='alert alert-error'>Invalid admission ID.</div>";
                exit;
            }
            
            // Get admission details
            $sql = "SELECT a.*, s.Name as student_name, s.Email, s.Phone, s.Address, s.DOB,
                           c.Course_Name, c.Duration, c.Fees, d.Dept_Name,
                           COALESCE(SUM(p.Amount), 0) as paid_amount
                    FROM admission a 
                    JOIN student s ON a.Student_ID = s.Student_ID 
                    JOIN course c ON a.Course_ID = c.Course_ID 
                    LEFT JOIN department d ON c.Dept_ID = d.Dept_ID
                    LEFT JOIN payment p ON a.Admission_ID = p.Admission_ID
                    WHERE a.Admission_ID = ?
                    GROUP BY a.Admission_ID";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $admission_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                echo "<div class='alert alert-error'>Admission record not found.</div>";
                exit;
            }
            
            $admission = $result->fetch_assoc();
            $balance = $admission['Fees'] - $admission['paid_amount'];
            
            // Get payment history
            $payment_sql = "SELECT * FROM payment WHERE Admission_ID = ? ORDER BY Payment_Date DESC";
            $payment_stmt = $conn->prepare($payment_sql);
            $payment_stmt->bind_param("i", $admission_id);
            $payment_stmt->execute();
            $payment_result = $payment_stmt->get_result();
            
            // Store payment history in array for multiple use
            $payment_history = [];
            while($payment = $payment_result->fetch_assoc()) {
                $payment_history[] = $payment;
            }
            ?>
            
            <!-- Print Header (visible only in print) -->
            <div class="print-header" style="display: none;">
                <h1 style="color: #2c5aa0; margin-bottom: 10px;">🎓 ADMISSION MANAGEMENT SYSTEM</h1>
                <h2 style="margin: 0; color: #333;">ADMISSION CONFIRMATION SLIP</h2>
                <p style="margin: 5px 0; color: #666;">Official Document - Keep for Records</p>
            </div>
            
            <!-- Action Buttons (hidden in print) -->
            <div class="card no-print">
                <div class="btn-group">
                    <button onclick="printPage()" class="btn btn-primary">🖨️ Print Slip (Two Columns)</button>
                    <a href="payment_entry.php?admission_id=<?php echo $admission_id; ?>" class="btn btn-success">💰 Add Payment</a>
                    <a href="search_admissions.php" class="btn btn-secondary">🔍 Back to Search</a>
                    <a href="index.php" class="btn btn-secondary">🏠 Dashboard</a>
                </div>
                <div style="margin-top: 10px; padding: 10px; background: #e7f3ff; border-radius: 6px; font-size: 14px; color: #0056b3;">
                    📄 <strong>Print Info:</strong> This slip will print in two-column format (Student Copy & Office Copy) on a single page to save paper.
                </div>
            </div>
            
            <!-- Admission Slip -->
            <div class="card" style="margin-top: 0; transition: none;">
                <!-- Header -->
                <div class="card-header" style="text-align: center; border-bottom: 3px solid #2c5aa0;">
                    <h1 class="card-title" style="color: #2c5aa0; font-size: 26px; margin-bottom: 5px;">🎓 ADMISSION MANAGEMENT SYSTEM</h1>
                    <h2 style="color: #333; margin: 0; font-size: 20px;">ADMISSION CONFIRMATION SLIP</h2>
                    <p style="color: #666; margin: 5px 0;">Official Document - Keep for Records</p>
                </div>
                
                <!-- Print-optimized Two-Column Layout (visible only in print) -->
                <div class="admission-slip-print" style="display: none;">
                    <!-- Left Column -->
                    <div class="slip-column">
                        <div class="slip-header">
                            <h1>🎓 ADMISSION MANAGEMENT</h1>
                            <h2>ADMISSION SLIP - COPY 1</h2>
                            <p>Student Copy - Keep for Records</p>
                        </div>
                        
                        <div class="admission-id-print">
                            Admission ID: <?php echo $admission['Admission_ID']; ?>
                        </div>
                        
                        <div class="info-section">
                            <h3>Student Information</h3>
                            <table class="info-table">
                                <tr><td>Name:</td><td><?php echo htmlspecialchars($admission['student_name']); ?></td></tr>
                                <tr><td>Student ID:</td><td><?php echo $admission['Student_ID']; ?></td></tr>
                                <tr><td>Email:</td><td><?php echo htmlspecialchars($admission['Email']); ?></td></tr>
                                <tr><td>Phone:</td><td><?php echo htmlspecialchars($admission['Phone']); ?></td></tr>
                                <tr><td>DOB:</td><td><?php echo date('M d, Y', strtotime($admission['DOB'])); ?></td></tr>
                                <tr><td>Address:</td><td><?php echo htmlspecialchars($admission['Address']); ?></td></tr>
                            </table>
                        </div>
                        
                        <div class="info-section">
                            <h3>Course Information</h3>
                            <table class="info-table">
                                <tr><td>Course:</td><td><?php echo htmlspecialchars($admission['Course_Name']); ?></td></tr>
                                <tr><td>Course ID:</td><td><?php echo $admission['Course_ID']; ?></td></tr>
                                <tr><td>Department:</td><td><?php echo $admission['Dept_Name'] ? htmlspecialchars($admission['Dept_Name']) : 'N/A'; ?></td></tr>
                                <tr><td>Duration:</td><td><?php echo htmlspecialchars($admission['Duration']); ?></td></tr>
                                <tr><td>Admission Date:</td><td><?php echo date('M d, Y', strtotime($admission['Admission_Date'])); ?></td></tr>
                            </table>
                        </div>
                        
                        <div class="info-section">
                            <h3>Payment Summary</h3>
                            <div class="payment-print">
                                <div class="payment-amount">Total Fees: ৳<?php echo number_format($admission['Fees'], 2); ?></div>
                                <div class="payment-amount">Paid: ৳<?php echo number_format($admission['paid_amount'], 2); ?></div>
                                <div class="payment-amount">Balance: ৳<?php echo number_format($balance, 2); ?></div>
                                <div class="payment-amount">Status: <?php echo $admission['Payment_Status']; ?></div>
                            </div>
                        </div>
                        
                        <div class="signature-print">
                            <div class="signature-box-print">
                                <div class="signature-line"></div>
                                <div class="signature-label">Student</div>
                            </div>
                            <div class="signature-box-print">
                                <div class="signature-line"></div>
                                <div class="signature-label">Officer</div>
                            </div>
                        </div>
                        
                        <div class="footer-print">
                            Generated: <?php echo date('M d, Y g:i A'); ?><br>
                            © 2025 Admission Management System
                        </div>
                    </div>
                    
                    <!-- Right Column -->
                    <div class="slip-column">
                        <div class="slip-header">
                            <h1>🎓 ADMISSION MANAGEMENT</h1>
                            <h2>ADMISSION SLIP - COPY 2</h2>
                            <p>Office Copy - Keep for Records</p>
                        </div>
                        
                        <div class="admission-id-print">
                            Admission ID: <?php echo $admission['Admission_ID']; ?>
                        </div>
                        
                        <div class="info-section">
                            <h3>Student Information</h3>
                            <table class="info-table">
                                <tr><td>Name:</td><td><?php echo htmlspecialchars($admission['student_name']); ?></td></tr>
                                <tr><td>Student ID:</td><td><?php echo $admission['Student_ID']; ?></td></tr>
                                <tr><td>Email:</td><td><?php echo htmlspecialchars($admission['Email']); ?></td></tr>
                                <tr><td>Phone:</td><td><?php echo htmlspecialchars($admission['Phone']); ?></td></tr>
                                <tr><td>DOB:</td><td><?php echo date('M d, Y', strtotime($admission['DOB'])); ?></td></tr>
                                <tr><td>Address:</td><td><?php echo htmlspecialchars($admission['Address']); ?></td></tr>
                            </table>
                        </div>
                        
                        <div class="info-section">
                            <h3>Course Information</h3>
                            <table class="info-table">
                                <tr><td>Course:</td><td><?php echo htmlspecialchars($admission['Course_Name']); ?></td></tr>
                                <tr><td>Course ID:</td><td><?php echo $admission['Course_ID']; ?></td></tr>
                                <tr><td>Department:</td><td><?php echo $admission['Dept_Name'] ? htmlspecialchars($admission['Dept_Name']) : 'N/A'; ?></td></tr>
                                <tr><td>Duration:</td><td><?php echo htmlspecialchars($admission['Duration']); ?></td></tr>
                                <tr><td>Admission Date:</td><td><?php echo date('M d, Y', strtotime($admission['Admission_Date'])); ?></td></tr>
                            </table>
                        </div>
                        
                        <div class="info-section">
                            <h3>Payment Summary</h3>
                            <div class="payment-print">
                                <div class="payment-amount">Total Fees: ৳<?php echo number_format($admission['Fees'], 2); ?></div>
                                <div class="payment-amount">Paid: ৳<?php echo number_format($admission['paid_amount'], 2); ?></div>
                                <div class="payment-amount">Balance: ৳<?php echo number_format($balance, 2); ?></div>
                                <div class="payment-amount">Status: <?php echo $admission['Payment_Status']; ?></div>
                            </div>
                        </div>
                        
                        <?php if (count($payment_history) > 0): ?>
                        <div class="info-section">
                            <h3>Payment History</h3>
                            <table class="info-table">
                                <?php foreach($payment_history as $payment): ?>
                                    <tr>
                                        <td>৳<?php echo number_format($payment['Amount'], 2); ?></td>
                                        <td><?php echo date('M d', strtotime($payment['Payment_Date'])); ?></td>
                                        <td><?php echo $payment['Payment_Method']; ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </table>
                        </div>
                        <?php endif; ?>
                        
                        <div class="signature-print">
                            <div class="signature-box-print">
                                <div class="signature-line"></div>
                                <div class="signature-label">Student</div>
                            </div>
                            <div class="signature-box-print">
                                <div class="signature-line"></div>
                                <div class="signature-label">Officer</div>
                            </div>
                        </div>
                        
                        <div class="footer-print">
                            Generated: <?php echo date('M d, Y g:i A'); ?><br>
                            © 2025 Admission Management System
                        </div>
                    </div>
                </div>
                
                <!-- Admission Details -->
                <div style="padding: 20px 0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px; border-radius: 8px; display: inline-block;">
                            <h3 style="margin: 0; font-size: 18px;">Admission ID: <?php echo $admission['Admission_ID']; ?></h3>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <h3 style="color: #667eea; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-bottom: 16px;">Student Information</h3>
                            <table style="width: 100%; line-height: 1.8;">
                                <tr>
                                    <td style="font-weight: bold; width: 120px;">Name:</td>
                                    <td><?php echo htmlspecialchars($admission['student_name']); ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Student ID:</td>
                                    <td><?php echo $admission['Student_ID']; ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Email:</td>
                                    <td><?php echo htmlspecialchars($admission['Email']); ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Phone:</td>
                                    <td><?php echo htmlspecialchars($admission['Phone']); ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Date of Birth:</td>
                                    <td><?php echo date('F d, Y', strtotime($admission['DOB'])); ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; vertical-align: top;">Address:</td>
                                    <td><?php echo htmlspecialchars($admission['Address']); ?></td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="col-md-6">
                            <h3 style="color: #667eea; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-bottom: 16px;">Course Information</h3>
                            <table style="width: 100%; line-height: 1.8;">
                                <tr>
                                    <td style="font-weight: bold; width: 120px;">Course:</td>
                                    <td><?php echo htmlspecialchars($admission['Course_Name']); ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Course ID:</td>
                                    <td><?php echo $admission['Course_ID']; ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Department:</td>
                                    <td><?php echo $admission['Dept_Name'] ? htmlspecialchars($admission['Dept_Name']) : 'N/A'; ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Duration:</td>
                                    <td><?php echo htmlspecialchars($admission['Duration']); ?></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold;">Admission Date:</td>
                                    <td><?php echo date('F d, Y', strtotime($admission['Admission_Date'])); ?></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Payment Information -->
                    <div style="margin-top: 20px;">
                        <h3 style="color: #667eea; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-bottom: 16px;">Payment Information</h3>
                        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px;">
                            <div class="row">
                                <div class="col-md-3">
                                    <div style="text-align: center; padding: 12px; background: white; border-radius: 6px; margin-bottom: 12px;">
                                        <div style="font-size: 20px; font-weight: bold; color: #333;">৳ <?php echo number_format($admission['Fees'], 2); ?></div>
                                        <div style="color: #666; font-size: 13px;">Total Fees</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div style="text-align: center; padding: 12px; background: white; border-radius: 6px; margin-bottom: 12px;">
                                        <div style="font-size: 20px; font-weight: bold; color: #28a745;">৳ <?php echo number_format($admission['paid_amount'], 2); ?></div>
                                        <div style="color: #666; font-size: 13px;">Paid Amount</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div style="text-align: center; padding: 12px; background: white; border-radius: 6px; margin-bottom: 12px;">
                                        <div style="font-size: 20px; font-weight: bold; color: <?php echo $balance > 0 ? '#dc3545' : '#28a745'; ?>;">৳ <?php echo number_format($balance, 2); ?></div>
                                        <div style="color: #666; font-size: 13px;">Balance</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div style="text-align: center; padding: 12px; background: white; border-radius: 6px; margin-bottom: 12px;">
                                        <div style="font-size: 16px; font-weight: bold;">
                                            <span class="status-badge status-<?php echo strtolower($admission['Payment_Status']); ?>"><?php echo $admission['Payment_Status']; ?></span>
                                        </div>
                                        <div style="color: #666; font-size: 13px;">Status</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment History -->
                    <?php if (count($payment_history) > 0): ?>
                        <div style="margin-top: 20px;">
                            <h3 style="color: #2c5aa0; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-bottom: 16px;">Payment History</h3>
                            <div class="table-responsive">
                                <table class="table" style="font-size: 14px;">
                                    <thead>
                                        <tr>
                                            <th>Payment ID</th>
                                            <th>Amount</th>
                                            <th>Payment Date</th>
                                            <th>Method</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach($payment_history as $payment): ?>
                                            <tr>
                                                <td><?php echo $payment['Payment_ID']; ?></td>
                                                <td>৳<?php echo number_format($payment['Amount'], 2); ?></td>
                                                <td><?php echo date('M d, Y', strtotime($payment['Payment_Date'])); ?></td>
                                                <td><?php echo $payment['Payment_Method']; ?></td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Important Notes -->
                    <div style="margin-top: 20px; padding: 16px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                        <h4 style="color: #856404; margin: 0 0 12px 0;">📋 Important Instructions:</h4>
                        <ul style="color: #856404; margin: 0; padding-left: 20px;">
                            <li>Please keep this admission slip for your records</li>
                            <li>This document serves as proof of your admission</li>
                            <li>Present this slip during the first day of classes</li>
                            <?php if ($balance > 0): ?>
                                <li style="color: #dc3545; font-weight: bold;">Outstanding balance of ৳ <?php echo number_format($balance, 2); ?> must be paid before course commencement</li>
                            <?php endif; ?>
                            <li>Contact the admission office for any queries</li>
                        </ul>
                    </div>
                    
                    <!-- Signature Section -->
                    <div class="signature-section" style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
                        <div class="signature-box" style="text-align: center;">
                            <div style="border-top: 1px solid #333; width: 180px; margin: 40px auto 8px auto;"></div>
                            <div style="font-size: 13px; color: #666;">Student Signature</div>
                        </div>
                        
                        <div style="text-align: center;">
                            <div style="width: 80px; height: 80px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px auto; color: #999; font-size: 11px;">
                                OFFICIAL<br>SEAL
                            </div>
                        </div>
                        
                        <div class="signature-box" style="text-align: center;">
                            <div style="border-top: 1px solid #333; width: 180px; margin: 40px auto 8px auto;"></div>
                            <div style="font-size: 13px; color: #666;">Admission Officer</div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="margin-top: 25px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 16px;">
                        <p>Generated on: <?php echo date('F d, Y \a\t g:i A'); ?></p>
                        <p>© 2025 Admission Management System - This is an official document</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="js/script.js"></script>
    
    <style>
        /* Override hover effects for admission slip */
        .card {
            transition: none !important;
        }
        
        .card:hover {
            transform: none !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08) !important;
        }
        
        .btn:hover {
            transform: translateY(0px) !important;
        }
    </style>
</body>
</html>

<?php 
$stmt->close();
if (isset($payment_stmt)) $payment_stmt->close();
$conn->close(); 
?>
