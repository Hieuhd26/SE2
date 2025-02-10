"use strict";
const express = require("express");
const connection = require("./dbconnect");
const { encrypted, decrypted } = require("./crypto");

const app = express();

require("dotenv").config();

const multer = require("multer");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");

app.get("/home", function (req, res) {
  res.render("./pages/home");
});

app.get("/user", async function (req, res) {
  let sql = "SELECT id, name, role FROM users;";
  let [result] = await connection.query(sql);
  res.render("./pages/user", { result: result });
});

app.get("/user/add", function (req, res) {
  res.render("./pages/addUserPage");
});

app.post("/user/add", async function (req, res) {
  const { name, password, role } = req.body;
  if (!name || !role) {
    return res.status(400).json({ message: "Please input all" });
  }
  try {
    let sql = "INSERT INTO users (name, password, role) VALUES (?, ?, ?)";
    const encryptedPassword = encrypted(password);
    let rs = await connection.query(sql, [name, encryptedPassword, role]);
    alert("Done");
    res.status(201).json({ message: "Done" });
  } catch (error) {
    res.status(500).json({ message: "Error!" });
  }
});

app.post(
  "/project/add",
  multer({ dest: "uploads/" }).single("avatar"),
  async (req, res) => {
    let ava = req.file;
    await fs.rename(ava.path, "public/images/" + ava.originalname);
    res.send("Upload complete!");
  }
);

app.listen(process.env.PORT);
