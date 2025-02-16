const express = require("express");
const crypto = require("crypto");
const connection = require("./dbconnect");
const router = express.Router();

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex"); // Tạo salt ngẫu nhiên
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex"); // Hash password
    return { salt, hash };
}

function verifyPassword(password, salt, hash) {
    const newHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return newHash === hash;
}

// const password = "mypassword123";
// const { salt, hash } = hashPassword(password);
// console.log("Salt:", salt);
// console.log("Hash:", hash);

// // Kiểm tra password có khớp không
// console.log("Password đúng?", verifyPassword("mypassword123", salt, hash)); // true
// console.log("Password sai?", verifyPassword("wrongpassword", salt, hash)); // false

router.get("", async function (req, res) {
    let sql = "SELECT id, name, role, status FROM users;";
    let [result] = await connection.query(sql);
    res.render("./pages/user", { result: result });
});

router.get("/add", function (req, res) {
    res.render("./pages/addUserPage");
});

router.post("/add", async function (req, res) {
    const { name, password, role } = req.body;
    if (!name || !password || !role) {
        return res.status(400).json({ message: "Please input all" });
    }
    try {
        
        const {hash} = hashPassword(password)
        console.log(hash);

        let sql = "INSERT INTO users (name, password, role, status) VALUES (?, ?, ?,'true')";
        await connection.query(sql, [name, hash, role]);
        res.status(201).json({ message: "Done" });
    } catch (error) {
        console.log("lỗi rồi");
        res.status(500).json({ message: "Error!" });
    }
});

router.put("/edit/:id", async function (req, res) {
    const { name, password, role } = req.body;
    const userId = req.params.id;

    if (!name || !role) {
        return res.status(400).json({ message: "Please input all required fields" });
    }

    try {
        let hashedPassword = null;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        let sql = hashedPassword
            ? "UPDATE users SET name = ?, password = ?, role = ? WHERE id = ?"
            : "UPDATE users SET name = ?, role = ? WHERE id = ?";

        let params = hashedPassword ? [name, hashedPassword, role, userId] : [name, role, userId];

        await connection.query(sql, params);
        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error!" });
    }
});

router.patch("/toggle-status/:id", async function (req, res) {
    const userId = req.params.id;

    try {
        // Lấy trạng thái hiện tại của user
        let [rows] = await connection.query("SELECT status FROM users WHERE id = ?", [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Đảo trạng thái (toggle)
        let newStatus = rows[0].status === "true" ? "false" : "true";

        // Cập nhật trạng thái mới vào database
        await connection.query("UPDATE users SET status = ? WHERE id = ?", [newStatus, userId]);

        res.status(200).json({ message: "User status updated", status: newStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error!" });
    }
});
module.exports = router;