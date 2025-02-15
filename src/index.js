"use strict";
const express = require("express");
const connection = require("./dbconnect");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const app = express();
const AppError = require("./AppError");
const bcrypt = require("bcryptjs");
const userRoutes = require("./userRoutes");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/users", userRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));


app.get("/login", (req, res) => {
  res.render("pages/loginPage");
});

// Xử lý đăng nhập
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await connection.query("SELECT * FROM users WHERE name = ? and status ='true'", [username]);
    if (users.length === 0) return res.render("pages/loginPage", { error: "Sai tài khoản hoặc mật khẩuu hoặc tài khoản bị khóa" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render("pages/loginPage", { error: "Sai tài khoản hoặc mật khẩu!" });

    // Lưu userId vào cookie
    res.cookie("userId", user.id, { httpOnly: true, maxAge: 3600000 });
    res.redirect("/projects");
  } catch (err) {
    res.status(500).send("Lỗi server!");
  }
});

// Xử lý đăng xuất
app.get("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/login");
});



app.get("/projects"
  //, requireAuth
  , async function (req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 2;
    let offset = (page - 1) * limit;
    let validColumns = ["id", "name", "course", "year"];
    let sortBy = validColumns.includes(req.query.sortBy) ? req.query.sortBy : "id";
    let order = req.query.order === "desc" ? "desc" : "asc";
    let search = req.query.search ? `%${req.query.search}%` : "%";
    const [[{ total }]] = await connection.query(
      "SELECT COUNT(*) AS total FROM projects WHERE name LIKE ? OR course LIKE ?",
      [search, search]
    );
    const [projects] = await connection.query(
      `SELECT id, name, course, year FROM projects 
       WHERE name LIKE ? OR course LIKE ? 
       ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`,
      [search, search, limit, offset]
    );
    let totalPages = Math.ceil(total / limit);
    res.render("./pages/projectPage", { projects, page, totalPages, sortBy, order, search: req.query.search || "" });
  } catch (err) {
    next(new AppError("Yêu cầu không hợp lệ!", 400));
  }
});

app.get("/addProjectPage", function (req, res) {
  res.render("./pages/addProjectPage");
});


app.get("/projects/:id", async (req, res) => {
  try {
    const sql_user = `SELECT 
    p.id AS project_id, 
    p.name AS project_name, 
    p.semester, 
    p.year, 
    p.course, 
    u.id AS creator_id, 
    u.name AS creator_name
    
    FROM projects p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = ?;`;

    const sql_student = `SELECT 
    s.id AS student_id, 
    s.name AS student_name
    FROM project_students ps
    JOIN students s ON ps.student_id = s.id
    WHERE ps.project_id = ?;
    `;

    const sql_image = `SELECT 
    pi.image_url, 
    pi.uploaded_at
    FROM project_images pi
    WHERE pi.project_id = ?;`;

    const [user] = await connection.execute(sql_user, [req.params.id]);
    const [student] = await connection.execute(sql_student, [req.params.id]);
    const [image] = await connection.execute(sql_image, [req.params.id]);

    if (user.length === 0 && student.length === 0 && image.length === 0) {
      return res.status(404).send("Dự án không tồn tại");
    }

    const projectInfo = {
      id: user[0].project_id,
      name: user[0].project_name,
      semester: user[0].semester,
      year: user[0].year,
      course: user[0].course,
      creator: {
        name: user[0].creator_name,
      },
      students: student,
      images: image,
    };
    res.render("./pages/projectDetailPage", { projectInfo });
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi lấy chi tiết dự án");
  }
});



app.post("/addProject", upload.array("files"), async function (req, res) {
  const { name, semester, year, course } = req.body;
  const studentsList = JSON.parse(req.body.students);
  const files = req.files;

  try {
    await connection.beginTransaction();

    const [projectResult] = await connection.execute(
      "INSERT INTO projects (name, semester, year, course, created_by) VALUES (?, ?, ?, ?, ?)",
      [name, semester, year, course, 2]
    );
    const projectId = projectResult.insertId;

    for (const student of studentsList) {
      await connection.execute(
        "INSERT INTO students (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)",
        [student.id, student.name]
      );

      await connection.execute(
        "INSERT INTO project_students (project_id, student_id) VALUES (?, ?)",
        [projectId, student.id]
      );
    }

    for (const file of files) {
      const imageUrl = file.filename;
      await connection.execute(
        "INSERT INTO project_images (project_id, image_url) VALUES (?, ?)",
        [projectId, imageUrl]
      );
    }

    await connection.commit();

    res.status(201).json({ message: "Project added successfully!" });
  } catch (error) {
    // Nếu có lỗi, rollback transaction
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: "Error adding project", error });
  }
});

app.get("*", function (req, res) {
  res.send("Sorry, this is an invalid URL.");
});
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Đã có lỗi xảy ra!";

  res.status(statusCode).render("./pages/errorPage", { statusCode, message });
});

app.listen(process.env.PORT);
