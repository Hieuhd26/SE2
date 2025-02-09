const mysql = require("mysql2");
require('dotenv').config();
const connection = mysql
  .createConnection({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
  })
  .promise();
const fs = require("fs").promises;

(async function () {
  let content = await fs.readFile("./data.sql", { encoding: "utf8" });
  let lines = content.split("\r\n");
  let tmp = "";
  for (let line of lines) {
    line = line.trim();
    tmp += line + "\r\n";
    if (line.endsWith(";")) {
      await connection.execute(tmp);
      tmp = "";
    }
  }
  await connection.end();
})();
