const multer = require("multer");

// Sử dụng bộ nhớ tạm thời để lưu file
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

module.exports = upload;
