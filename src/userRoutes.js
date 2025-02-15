const express = require("express");
const bcrypt = require("bcryptjs");
const connection = require("./dbconnect");
const router = express.Router();

router.get("", async function (req, res) {
    let sql = "SELECT id, name, role FROM users;";
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
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(hashedPassword);

        let sql = "INSERT INTO users (name, password, role, status) VALUES (?, ?, ?,'true')";
        await connection.query(sql, [name, hashedPassword, role]);
        res.status(201).json({ message: "Done" });
    } catch (error) {
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

router.delete("/delete/:id", async function (req, res) {
    const userId = req.params.id;

    try {
        let sql = "UPDATE users SET status = 'false' WHERE id = ?";
        await connection.query(sql, [userId]);

        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error!" });
    }
});


module.exports = router;