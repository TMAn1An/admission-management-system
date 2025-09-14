-- Admission Management System Database Setup
-- DBMS Course Project

CREATE DATABASE IF NOT EXISTS admission_management;
USE admission_management;

-- Create Department table
CREATE TABLE IF NOT EXISTS department (
    Dept_ID INT AUTO_INCREMENT PRIMARY KEY,
    Dept_Name VARCHAR(100) NOT NULL,
    Dept_Head VARCHAR(100)
);

-- Create Course table
CREATE TABLE IF NOT EXISTS course (
    Course_ID INT AUTO_INCREMENT PRIMARY KEY,
    Course_Name VARCHAR(150) NOT NULL,
    Duration VARCHAR(50) NOT NULL,
    Fees DECIMAL(10,2) NOT NULL,
    Dept_ID INT,
    FOREIGN KEY (Dept_ID) REFERENCES department(Dept_ID)
);

-- Create Student table
CREATE TABLE IF NOT EXISTS student (
    Student_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Address TEXT NOT NULL,
    DOB DATE NOT NULL,
    Created_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Admission table
CREATE TABLE IF NOT EXISTS admission (
    Admission_ID INT AUTO_INCREMENT PRIMARY KEY,
    Student_ID INT NOT NULL,
    Course_ID INT NOT NULL,
    Admission_Date DATE NOT NULL,
    Payment_Status ENUM('Pending', 'Partial', 'Complete') DEFAULT 'Pending',
    Created_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Student_ID) REFERENCES student(Student_ID) ON DELETE CASCADE,
    FOREIGN KEY (Course_ID) REFERENCES course(Course_ID) ON DELETE CASCADE
);

-- Create Payment table
CREATE TABLE IF NOT EXISTS payment (
    Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Admission_ID INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Payment_Date DATE NOT NULL,
    Payment_Method ENUM('Cash', 'Card', 'Online', 'Cheque') DEFAULT 'Cash',
    Created_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Admission_ID) REFERENCES admission(Admission_ID) ON DELETE CASCADE
);

-- Insert sample data for departments
INSERT INTO department (Dept_Name, Dept_Head) VALUES
('Computer Science', 'Dr. John Smith'),
('Information Technology', 'Dr. Sarah Johnson'),
('Electronics', 'Dr. Michael Brown'),
('Mechanical Engineering', 'Dr. Emily Davis');

-- Insert sample data for courses
INSERT INTO course (Course_Name, Duration, Fees, Dept_ID) VALUES
('Bachelor of Computer Science', '4 Years', 50000.00, 1),
('Master of Computer Applications', '2 Years', 35000.00, 1),
('Bachelor of Information Technology', '4 Years', 45000.00, 2),
('Diploma in Web Development', '1 Year', 25000.00, 2),
('Bachelor of Electronics', '4 Years', 40000.00, 3),
('Bachelor of Mechanical Engineering', '4 Years', 48000.00, 4);

-- Insert sample students
INSERT INTO student (Name, Email, Phone, Address, DOB) VALUES
('Alice Johnson', 'alice.johnson@email.com', '9876543210', '123 Main Street, City Center', '2000-05-15'),
('Bob Smith', 'bob.smith@email.com', '9876543211', '456 Oak Avenue, Downtown', '1999-12-10'),
('Charlie Brown', 'charlie.brown@email.com', '9876543212', '789 Pine Road, Suburbs', '2001-03-22');

-- Insert sample admissions
INSERT INTO admission (Student_ID, Course_ID, Admission_Date, Payment_Status) VALUES
(1, 1, '2024-06-01', 'Complete'),
(2, 2, '2024-06-15', 'Partial'),
(3, 3, '2024-07-01', 'Pending');

-- Insert sample payments
INSERT INTO payment (Admission_ID, Amount, Payment_Date, Payment_Method) VALUES
(1, 50000.00, '2024-06-01', 'Online'),
(2, 20000.00, '2024-06-15', 'Card');
