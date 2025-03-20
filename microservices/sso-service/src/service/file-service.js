const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // Sử dụng uuid để tạo GUID

// Hàm kiểm tra và tạo folder nếu chưa tồn tại
const checkAndCreateFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// Hàm xóa file nếu tồn tại
const deleteFileIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath); // Xóa file nếu tồn tại
  }
};
// Hàm xóa folder nếu tồn tại
const deleteFolderIfExists = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath);
    files.forEach((file) => {
      const currentPath = path.join(folderPath, file);
      if (fs.statSync(currentPath).isDirectory()) {
        deleteFolderIfExists(currentPath); // xóa cái folder
      } else {
        fs.unlinkSync(currentPath); // xóa các tệp
      }
    });

    fs.rmdirSync(folderPath); // Xóa folder nếu tồn tại
  }
};

const uploadSingleFile = (file, folderPath, imgName) => {
  let newFileName;

  // Kiểm tra imgName, nếu có, sử dụng tên file đó
  if (!imgName || imgName.trim() === "") {
    newFileName = uuidv4() + path.extname(file.originalname); // Tạo file mới với UUID
  } else {
    newFileName = imgName; // Giữ nguyên tên file nếu imgName được cung cấp
    const oldFilePath = path.join(
      __dirname,
      "../../public",
      folderPath,
      imgName
    );

    // Kiểm tra nếu file cũ tồn tại thì xóa
    deleteFileIfExists(oldFilePath); // Xóa file cũ nếu tồn tại
    newFileName = uuidv4() + path.extname(file.originalname);
  }

  return new Promise((resolve, reject) => {
    const newFullFolderPath = path.join(__dirname, "../../public", folderPath); // Đường dẫn tới thư mục

    checkAndCreateFolder(newFullFolderPath); // Tạo thư mục nếu chưa tồn tại

    const filePath = path.join(newFullFolderPath, newFileName); // Đường dẫn đầy đủ tới file mới

    // Lưu file vào hệ thống
    fs.writeFile(filePath, file.buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          message: "File uploaded successfully!",
          fileName: newFileName,
          folderPath,
        });
      }
    });
  });
};

const uploadSingleFileAsync = (file, folderPath, imgName) => {
  const newFullFolderPath = path.join(
    __dirname,
    "../../../product-service/public",
    folderPath
  ); // Đường dẫn tới thư mục
  return new Promise((resolve, reject) => {
    // Tạo thư mục nếu chưa tồn tại
    checkAndCreateFolder(newFullFolderPath);

    // Tạo tên file mới
    const newFileName =
      imgName && imgName.trim() !== ""
        ? imgName
        : uuidv4() + path.extname(file.originalname);

    const filePath = path.join(newFullFolderPath, newFileName);

    // Nếu imgName tồn tại và file cũ đã có thì xóa file cũ
    if (imgName && imgName.trim() !== "") {
      const oldFilePath = path.join(newFullFolderPath, imgName);
      deleteFileIfExists(oldFilePath); // Xóa file cũ nếu tồn tại
    }

    // Lưu file mới vào thư mục
    fs.writeFile(filePath, file.buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          message: "File uploaded successfully!",
          fileName: newFileName,
          folderPath: newFullFolderPath,
        });
      }
    });
  });
};

// Hàm xử lý upload nhiều file với GUID
const uploadMultipleFiles = (files, folderPath) => {
  return new Promise((resolve, reject) => {
    deleteFolderIfExists(folderPath); // Xóa folder cũ nếu tồn tại
    checkAndCreateFolder(folderPath); // Tạo folder mới

    const uploadPromises = files.map((file) => {
      // Tạo tên file mới với GUID
      const newFileName = uuidv4() + path.extname(file.originalname);
      const filePath = path.join(folderPath, newFileName);

      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, file.buffer, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              fileName: newFileName,
              message: `File ${file.originalname} uploaded successfully!`,
              folderPath,
            });
          }
        });
      });
    });

    // Sử dụng Promise.all để chờ tất cả các file được upload xong
    Promise.all(uploadPromises)
      .then((results) => resolve(results))
      .catch((error) => reject(error));
  });
};

const uploadMultipleFilesAsync = (files, folderPath, distinctive) => {
  let pathTosave;
  process.env.NODE_ENV === "production"
    ? (pathTosave = "/app/public")
    : (pathTosave = path.join(__dirname, "../../../product-service/public"));
  const fullFolderPath = path.join(pathTosave, folderPath, distinctive);
  return new Promise((resolve, reject) => {
    // Xóa folder cũ nếu tồn tại
    deleteFolderIfExists(fullFolderPath);

    // Tạo folder mới nếu chưa có
    checkAndCreateFolder(fullFolderPath);

    const uploadPromises = files.map((file) => {
      // Tạo tên file mới với GUID
      // const newFileName = uuidv4() + path.extname(file.originalname);
      const newFileName = uuidv4() + ".png";
      const filePath = path.join(fullFolderPath, newFileName);

      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, file.buffer, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              fileName: newFileName,
              message: `File ${file.originalname} uploaded successfully!`,
              fullFolderPath,
            });
          }
        });
      });
    });

    // Sử dụng Promise.all để chờ tất cả các file được upload xong
    Promise.all(uploadPromises)
      .then((results) => {
        // Lấy danh sách tên file từ kết quả trả về
        const fileNames = results.map((file) => file.fileName);
        resolve({
          fileNames: JSON.stringify(fileNames), // Trả về danh sách tên file
          message: "Tất cả các file đã được tải lên thành công!",
          folderPath: fullFolderPath,
        });
      })
      .catch((error) => reject(error));
  });
};

const uploadFilesJoinInFolderAsync = (files, folderPath, distinctive) => {
  let pathTosave;
  process.env.NODE_ENV === "production"
    ? (pathTosave = "/app/public")
    : (pathTosave = path.join(__dirname, "../../../product-service/public"));
  const fullFolderPath = path.join(pathTosave, folderPath, distinctive);
  return new Promise((resolve, reject) => {
 

    const uploadPromises = files.map((file) => {
      // Tạo tên file mới với GUID
      // const newFileName = uuidv4() + path.extname(file.originalname);
      const newFileName = uuidv4() + ".png";
      const filePath = path.join(fullFolderPath, newFileName);

      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, file.buffer, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              fileName: newFileName,
              message: `File ${file.originalname} uploaded successfully!`,
              fullFolderPath,
            });
          }
        });
      });
    });

    // Sử dụng Promise.all để chờ tất cả các file được upload xong
    Promise.all(uploadPromises)
      .then((results) => {
        // Lấy danh sách tên file từ kết quả trả về
        const fileNames = results.map((file) => file.fileName);
        resolve({
          fileNames: JSON.stringify(fileNames), // Trả về danh sách tên file
          message: "Tất cả các file đã được tải lên thành công!",
          folderPath: fullFolderPath,
        });
      })
      .catch((error) => reject(error));
  });
};

const deleteFolder = (folderPath, distinctive) => {
  const fullFolderPath = path.join(
    __dirname,
    "../../public",
    folderPath,
    distinctive
  );
  deleteFolderIfExists(fullFolderPath);
  return true;
};
module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadMultipleFilesAsync,
  uploadFilesJoinInFolderAsync,
  uploadSingleFileAsync,
  deleteFolder,
};
