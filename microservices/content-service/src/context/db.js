const mysql = require("mysql2/promise");
require("dotenv").config();

// Tạo kết nối đến MySQL
const _context = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  port: process.env.DATABASE_PORT || "",
  user: process.env.DATABASE_USER || "dev",
  password: process.env.DATABASE_PASSWORD || "dev@123",
  database: process.env.DATABASE_NAME || "database",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Kiểm tra kết nối khi ứng dụng khởi động
async function checkConnection() {
  try {
    const connection = await _context.getConnection();
    connection.release();
  } catch (error) {
    console.error("Không thể kết nối đến  _context MySQL:", error.message);
  }
}

// Gọi hàm kiểm tra kết nối
checkConnection();

module.exports = _context;
