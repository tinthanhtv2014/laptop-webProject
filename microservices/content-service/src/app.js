require("dotenv").config(); // Nạp các biến môi trường từ file .env
const express = require("express");
const cors = require("cors"); // Thêm cors
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { PrismaClient } = require("@prisma/client"); // Thêm Prisma Client
const prisma = new PrismaClient(); // Khởi tạo Prisma Client
const path = require("path");
const _context = require("./context/db");
const app = express();

// Kích hoạt CORS với các thiết lập mặc định
app.use(
  cors({
    origin: "*", // Cho phép tất cả mọi nguồn (thường là mặc định)
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức HTTP được phép
    allowedHeaders: ["Content-Type", "Authorization"], // Các header được phép
  })
);

process.env.NODE_ENV === "production"
  ? app.use(express.static(path.join("/app", "public")))
  : app.use(express.static(path.join(__dirname, "../public")));
// Middleware xử lý JSON
app.use(express.json());

// Cấu hình Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0", // Định nghĩa chuẩn OpenAPI
    info: {
      title: "Product API Documentation",
      version: "1.0.0",
      description: "Tài liệu API cho hệ thống Product",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5004}`, // URL phát triển
      },
    ],
  },
  apis: ["./src/router/**/*.js"],
};

// Khởi tạo Swagger Docs
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Tạo route để hiển thị Swagger UI
const basicAuth = require("basic-auth-connect");

const username = "admin"; // Tên đăng nhập
const password = "dev@123#"; // Mật khẩu

// Middleware Basic Authentication
app.use(
  "/api-docs",
  basicAuth(username, password),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs)
);

const productPrivateRouter = require("./router/private-router/product-router");

app.use("/api/product", productPrivateRouter);

// Kết nối MySQL và log thông báo
// Function to connect using Prisma
async function connectToDatabase() {
  try {
    await prisma.$connect(); // Connect to MySQL database
    console.log("Successfully connected to the database using Prisma!");

    // Perform database-related tasks here
  } catch (error) {
    console.error(
      "Error while connecting to the database using Prisma:",
      error.message
    );
  } finally {
    await prisma.$disconnect(); // Release the database connection
    console.log("Database connection released successfully.");
  }
}

// Function to connect using MySQL2
async function connectMySql() {
  try {
    // Test the connection by running a simple query
    await _context.query("SELECT 1");
    console.log("Successfully connected to the MySQL database!");
  } catch (error) {
    console.error(
      "Error while connecting to the MySQL database:",
      error.message
    );
  }
}

// Call the functions for testing
(async () => {
  await connectToDatabase();
  await connectMySql();
})();

// Khởi động server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`SSO Service open on http://localhost:${PORT}`);
  console.log(`Tài liệu API có sẵn tại http://localhost:${PORT}/api-docs`);
});
