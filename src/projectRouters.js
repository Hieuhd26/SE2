const express = require("express");
const connection = require("./dbconnect");
require("dotenv").config();
const router = express.Router();
const path = require("path");
const authMiddleware = require("./authMiddleware");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get(
  "",
  //, requireAuth
  async function (req, res, next) {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 2;
      let offset = (page - 1) * limit;
      let validColumns = ["id", "name", "course", "year"];
      let sortBy = validColumns.includes(req.query.sortBy)
        ? req.query.sortBy
        : "id";
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
      res.render("./pages/projectPage", {
        projects,
        page,
        totalPages,
        sortBy,
        order,
        search: req.query.search || "",
      });
    } catch (err) {
      next(new AppError("Yêu cầu không hợp lệ!", 400));
    }
  }
);
router.use(authMiddleware);
router.get("/addProjectPage", function (req, res) {
  res.render("./pages/addProjectPage");
});

router.post("/addProject", upload.array("files"), async function (req, res) {
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

router.get("/:id", async (req, res) => {
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

module.exports = router;
