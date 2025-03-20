const axios = require("axios");

const accessURL = `${process.env.SSO_URL}/api/auths/checkPermission`;
const accessURLToken = `${process.env.SSO_URL}/api/auths/checkauth`;
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ message: "Không có quyền truy cập. Vui lòng cung cấp token." });
  }

  try {
    // const user = jwt.verify(token, secretKey);
    // req.user = user;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

const checkAuth = async (req, res) => {
  const accessToken = req.headers.authorization;
  if (accessToken) {
    const access = await axios.post(
      accessURLToken,
      {},
      {
        headers: {
          authorization: `${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return access.data;
  }
};

module.exports = { authenticateToken, checkAuth };
