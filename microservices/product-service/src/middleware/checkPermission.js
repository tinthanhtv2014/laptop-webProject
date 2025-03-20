const axios = require("axios");

const accessURL = `${process.env.SSO_URL}/api/auths/checkPermission`;

const checkpermission = async (req, router, action) => {
  const accessToken = req.headers.authorization;
  if (accessToken) {
    const access = await axios.post(
      accessURL,
      {
        router: router,
        action: action,
      },
      {
        headers: {
          Authorization: `${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return access.data;
  }
};

module.exports = { checkpermission };
