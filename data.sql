CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name NVARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('teacher', 'admin'))
);

CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name NVARCHAR(255) NOT NULL,
    semester VARCHAR(20),
    year VARCHAR(10),
    course VARCHAR(255),
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) 
);

CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_code VARCHAR(20) UNIQUE NOT NULL,
    full_name NVARCHAR(255) NOT NULL
);

CREATE TABLE project_students (
    project_id INT,
    student_id INT,
    PRIMARY KEY (project_id, student_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE project_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    image_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);


INSERT INTO users (name, password, role) VALUES
('Quân', 'wBYnEHEm9fXZERUZ3r+f4g==', 'admin'),
('Hiệu', 'ObGdRzsnqA4xq1ZKRKDdPw==', 'teacher');

INSERT INTO projects (name, semester, year, course, created_by) VALUES
('Car Project', 'Spring', '2025', 'SE2', 2),
('Web Development Project', 'Fall', '2024', 'SQA', 2);

INSERT INTO students (student_code, full_name) VALUES
('2101140026', 'Nguyen Van A'),
('2101140027', 'Tran Thi B'),
('2101140028', 'Le Hoang C');

INSERT INTO project_students (project_id, student_id) VALUES
(1, 1), (1, 2), (2, 2), (2, 3);





