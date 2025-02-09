const crypto = require("crypto");
function encrypted(input) {
  const key = "mypassword123456";
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
  let encrypted = cipher.update(input, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

function decrypted(input) {
  const decipher = crypto.createDecipheriv("aes-128-ecb", key, null);
  let decrypted = decipher.update(input, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypted, decrypted };
