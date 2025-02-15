CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name NVARCHAR(100),
    password VARCHAR(255) NOT NULL,
    status VARCHAR(10) NOT NULL,
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
    id VARCHAR(20) PRIMARY KEY NOT NULL,
    name NVARCHAR(255) NOT NULL
);

CREATE TABLE project_students (
    project_id INT,
    student_id VARCHAR(20) ,
    PRIMARY KEY (project_id, student_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE project_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    image_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);


INSERT INTO users (name, password, role,status) VALUES
('Quân', 'wBYnEHEm9fXZERUZ3r+f4g==', 'admin','true'),
('Hiệu', 'ObGdRzsnqA4xq1ZKRKDdPw==', 'teacher','true');

INSERT INTO projects (name, semester, year, course, created_by) VALUES
('Car Project 1', 'Spring', '2025', 'SE2', 2),
('Car Project 2', 'Spring', '2024', 'SE2', 2),
('Car Project 3', 'Spring', '2025', 'SQA', 2),
('Car Project 4', 'Spring', '2024', 'SQA', 2),
('Car Project 5', 'Spring', '2025', 'SE2', 2),
('Car Project 6', 'Spring', '2024', 'SE2', 2),
('Car Project 7', 'Spring', '2024', 'SQA', 2),
('Car Project 8', 'Spring', '2025', 'SQA', 2),
('Car Project 9', 'Spring', '2024', 'SQA', 2),
('Car Project 10', 'Spring', '2024', 'SE2', 2),
('Car Project 11', 'Spring', '2024', 'SQA', 2),
('Car Project 12', 'Spring', '2025', 'SE2', 2),

('Web Development Project', 'Fall', '2024', 'SQA', 2);

INSERT INTO students (id, name) VALUES
('2101140026', 'Nguyen Van A'),
('2101140027', 'Tran Thi B'),
('2101140028', 'Le Hoang C');

INSERT INTO project_students (project_id, student_id) VALUES
(1, "2101140026"), (1, "2101140027"), (2, "2101140028"), (1, "2101140028");





