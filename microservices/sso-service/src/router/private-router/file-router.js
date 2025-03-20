const express = require("express");
const multer = require("multer");
const fileService = require("../../service/file-service");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // Sử dụng uuid để tạo GUID

const router = express.Router();
// Cấu hình Multer
const storage = multer.memoryStorage(); // Sử dụng bộ nhớ tạm để lưu file trước khi xử lý
const upload = multer({ storage: storage });

// Kiểm tra các thuộc tính đầu vào
const validateRequest = (req, res, next) => {
  const { folderPath, id } = req.body;
  const file = req.file || req.files;

  if (!folderPath) {
    return res.status(400).json({ error: "folderPath is missing or empty" });
  }

  // if (!id) {
  //   return res.status(400).json({ error: 'id is missing or empty' });
  // }

  if (!file || file.length === 0) {
    return res.status(400).json({ error: "file is missing or empty" });
  }

  next(); // Nếu tất cả đều hợp lệ, tiếp tục tới xử lý tiếp theo
};

// Upload file đơn với kiểm tra đầu vào
router.post(
  "/uploadSingleFile",
  upload.single("file"),
  validateRequest,
  async (req, res) => {
    try {
      const { folderPath, imgName } = req.body;

      const result = await fileService.uploadSingleFile(
        req.file,
        folderPath,
        imgName
      );

      res.status(200).json({
        status: true,
        fileName: result.fileName,
        folderPath,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/uploadSingleFileAsync",
  upload.single("file"),
  validateRequest,
  async (req, res) => {
    try {
      const { folderPath, imgName } = req.body;

      const result = await fileService.uploadSingleFileAsync(
        req.file,
        folderPath,
        imgName
      );

      res.status(200).json({
        status: true,
        fileName: result.fileName,
        folderPath,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Upload nhiều file với kiểm tra đầu vào
// Route upload nhiều file
router.post(
  "/uploadMultipleFiles",
  upload.array("files", 10),
  validateRequest,
  async (req, res) => {
    try {
      const { folderPath, id } = req.body;
      const fullFolderPath = path.join(
        __dirname,
        "../../../public",
        folderPath,
        id
      );

      // Gọi service để upload các file
      const newFiles = await fileService.uploadMultipleFiles(
        req.files,
        fullFolderPath
      );

      // Lấy danh sách tên file từ kết quả trả về
      const fileNames = newFiles.map((file) => file.fileName);

      // Trả về kết quả theo định dạng yêu cầu
      res.status(200).json({
        status: true,
        listfileName: `[${fileNames.join(",")}]`,
        folderPath,
        id,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
module.exports = router;
