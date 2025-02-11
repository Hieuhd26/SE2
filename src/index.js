"use strict";
const express = require("express");
const connection = require("./dbconnect");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const { encrypted, decrypted } = require("./crypto");
const multer = require("multer");
const path = require("path");
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../tmp/")); 
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

app.use("/filepond", express.static("public"));

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

app.post("/addProject", upload.single("image"), function (req, res) {
  res.send(req.body);
  res.send(req.file);
});

app.listen(process.env.PORT);
