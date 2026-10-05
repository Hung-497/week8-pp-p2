const jwt = require("jsonwebtoken");
const config = require("../utils/config");
const User = require("../models/userModel");

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "authorization token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { _id } = jwt.verify(token, config.SECRET); //process.env.SECRET ?
    const user = await User.findById(_id);
    if (!user) {
      return res.status(401).json({
        error: "Request not authorized",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Request not authorized" });
  }
};

module.exports = requireAuth;
