"use strict";
const express = require("express");
const connection = require("./dbconnect");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
const AppError = require("./AppError");
const authMiddleware = require("./authMiddleware");
const userRoutes = require("./userRoutes");
const projectRoutes = require("./projectRouters");

app.set("view engine", "ejs");

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/users", authMiddleware, userRoutes);
app.use("/projects", projectRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.get("/login", (req, res) => {
  res.render("pages/loginPage");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await connection.query(
      "SELECT * FROM users WHERE name = ? and status ='true'",
      [username]
    );
    if (users.length === 0)
      return res.render("pages/loginPage", {
        error: "Sai tài khoản hoặc mật khẩuu hoặc tài khoản bị khóa",
      });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.render("pages/loginPage", {
        error: "Sai tài khoản hoặc mật khẩu!",
      });

    res.cookie("userId", user.id, { httpOnly: true, maxAge: 3600000 });
    res.redirect("/projects");
  } catch (err) {
    res.status(500).send("Lỗi server!");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/login");
});

app.get("*", function (req, res) {
  const statusCode = 500;
  const message = "Sorry, this is an invalid URL.";

  res.status(statusCode).render("./pages/errorPage", { statusCode, message });
});
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Đã có lỗi xảy ra!";

  res.status(statusCode).render("./pages/errorPage", { statusCode, message });
});

app.listen(process.env.PORT);
