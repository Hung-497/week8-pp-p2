const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const config = require("../utils/config");

const userResponse = (user) => ({
  username: user.username,
  name: user.name,
  phoneNumber: user.phoneNumber,
  role: user.role,
  token: jwt.sign({ id: user._id, username: user.username }, config.SECRET, { expiresIn: "1h" }),
});

const signup = async (req, res) => {
  const { username, password, phoneNumber, name, role = "user" } = req.body;
  if (![username, password, phoneNumber, name].every(value => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "Please add all fields" });
  }
  if (await User.findOne({ username })) {
    return res.status(400).json({ error: "User already exists" });
  }
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hashedPassword, phoneNumber, name, role });
    res.status(201).json(userResponse(user));
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: "User already exists" });
    throw error;
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return res.status(400).json({ error: "Please add all fields" });
  }
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  res.status(200).json(userResponse(user));
};

module.exports = { signup, login };