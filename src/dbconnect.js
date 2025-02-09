const mysql = require("mysql2");
require("dotenv").config();
const connection = mysql
  .createConnection({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
  })
  .promise();
module.exports = connection;
