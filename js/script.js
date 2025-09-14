// Modern Admission Management System JavaScript

// Utility Functions
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Form Validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            field.style.borderColor = '#28a745';
        }
    });
    
    // Email validation
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (field.value && !emailRegex.test(field.value)) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        }
    });
    
    // Phone validation
    const phoneFields = form.querySelectorAll('input[type="tel"]');
    phoneFields.forEach(field => {
        const phoneRegex = /^[0-9]{10}$/;
        if (field.value && !phoneRegex.test(field.value.replace(/\D/g, ''))) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        }
    });
    
    return isValid;
}

// Search functionality
function searchRecords() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tableRows = document.querySelectorAll('tbody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter by status
function filterByStatus(status) {
    const tableRows = document.querySelectorAll('tbody tr');
    
    tableRows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const statusCell = row.querySelector('.status-badge');
            if (statusCell && statusCell.textContent.toLowerCase().includes(status.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Print functionality
function printPage() {
    window.print();
}

// Confirm delete
function confirmDelete(id, type) {
    if (confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
        window.location.href = `delete_${type}.php?id=${id}`;
    }
}

// Auto-calculate payment status
function updatePaymentStatus(admissionId, totalFees, paidAmount) {
    let status = 'Pending';
    
    if (paidAmount >= totalFees) {
        status = 'Complete';
    } else if (paidAmount > 0) {
        status = 'Partial';
    }
    
    return status;
}

// Form submission with loading
function submitFormWithLoading(formId) {
    const form = document.getElementById(formId);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (!validateForm(formId)) {
        showAlert('Please fill in all required fields correctly.', 'error');
        return false;
    }
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Processing...';
    submitBtn.disabled = true;
    
    // Reset after 3 seconds if no response
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 3000);
    
    return true;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add active class to current nav item
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
    
    // Initialize search if search input exists
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchRecords);
    }
    
    // Add form validation listeners
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required') && !this.value.trim()) {
                    this.style.borderColor = '#dc3545';
                } else {
                    this.style.borderColor = '#28a745';
                }
            });
        });
    });
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Auto-hide alerts
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    });
});

// Course selection handler
function selectCourse(courseId, courseName, fees) {
    document.getElementById('course_id').value = courseId;
    document.getElementById('selected_course').textContent = courseName;
    document.getElementById('course_fees').textContent = formatCurrency(fees);
    
    // Close modal if exists
    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Student selection handler
function selectStudent(studentId, studentName, email) {
    document.getElementById('student_id').value = studentId;
    document.getElementById('selected_student').textContent = studentName;
    document.getElementById('student_email').textContent = email;
    
    // Close modal if exists
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Calculate remaining balance
function calculateBalance() {
    const totalFees = parseFloat(document.getElementById('total_fees').value) || 0;
    const paidAmount = parseFloat(document.getElementById('paid_amount').value) || 0;
    const balance = totalFees - paidAmount;
    
    const balanceElement = document.getElementById('remaining_balance');
    if (balanceElement) {
        balanceElement.textContent = formatCurrency(Math.max(0, balance));
    }
    
    // Update payment status
    const statusElement = document.getElementById('payment_status');
    if (statusElement) {
        let status = 'Pending';
        if (paidAmount >= totalFees) {
            status = 'Complete';
        } else if (paidAmount > 0) {
            status = 'Partial';
        }
        statusElement.textContent = status;
        statusElement.className = `status-badge status-${status.toLowerCase()}`;
    }
}

// Export to CSV (basic implementation)
function exportToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => {
            return '"' + cell.textContent.replace(/"/g, '""') + '"';
        });
        csv.push(rowData.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}
