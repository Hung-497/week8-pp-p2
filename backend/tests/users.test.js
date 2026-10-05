const mongoose = require("mongoose");
const supertest = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../app");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const config = require("../utils/config");

const api = supertest(app);

const validUser = {
  username: "jane.workout",
  password: "Workout123!",
  phoneNumber: "+358401234567",
  name: "Jane Workout",
  role: "user",
};

beforeAll(async () => {
  await connectDB();
  await User.init();
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /api/users/signup", () => {
  describe("when the payload is valid", () => {
    it("should return status 201", async () => {
      await api.post("/api/users/signup").send(validUser).expect(201)
        .expect("Content-Type", /application\/json/);
    });

    it("should return a username and valid token without the password", async () => {
      const response = await api.post("/api/users/signup").send(validUser).expect(201);
      expect(response.body.username).toBe(validUser.username);
      expect(response.body).toHaveProperty("token");
      expect(response.body).not.toHaveProperty("password");
      const decodedToken = jwt.verify(response.body.token, config.SECRET);
      expect(decodedToken.username).toBe(validUser.username);
    });

    it("should persist the user with a hashed password", async () => {
      await api.post("/api/users/signup").send(validUser).expect(201);
      const savedUser = await User.findOne({ username: validUser.username });
      expect(savedUser).not.toBeNull();
      expect(savedUser.name).toBe(validUser.name);
      expect(savedUser.phoneNumber).toBe(validUser.phoneNumber);
      expect(savedUser.role).toBe("user");
      expect(savedUser.password).not.toBe(validUser.password);
      expect(await bcrypt.compare(validUser.password, savedUser.password)).toBe(true);
    });

    it("should default the role to user", async () => {
      const { username, password, phoneNumber, name } = validUser;
      const response = await api.post("/api/users/signup")
        .send({ username, password, phoneNumber, name }).expect(201);
      expect(response.body.role).toBe("user");
    });

    it("should persist and return the selected role", async () => {
      const response = await api.post("/api/users/signup")
        .send({ ...validUser, role: "admin" }).expect(201);
      const savedUser = await User.findOne({ username: validUser.username });
      expect(savedUser.role).toBe("admin");
      expect(response.body.role).toBe("admin");
    });
  });

  describe("when the payload is invalid", () => {
    it("should reject an unsupported role", async () => {
      await api.post("/api/users/signup")
        .send({ ...validUser, role: "unsupported" }).expect(400);
      const usersAtEnd = await User.find({});
      expect(usersAtEnd).toHaveLength(0);
    });
    it("should return status 400 when required fields are missing", async () => {
      const response = await api.post("/api/users/signup")
        .send({ username: "missing" }).expect(400);
      expect(response.body).toHaveProperty("error", "Please add all fields");
    });

    it("should not persist a user in the database", async () => {
      await api.post("/api/users/signup").send({ username: "missing" }).expect(400);
      const usersAtEnd = await User.find({});
      expect(usersAtEnd).toHaveLength(0);
    });
  });

  describe("when the username is already registered", () => {
    it("should return status 400 without creating another user", async () => {
      await api.post("/api/users/signup").send(validUser).expect(201);
      const response = await api.post("/api/users/signup")
        .send({ ...validUser, name: "Another Workout User" }).expect(400);
      expect(response.body).toHaveProperty("error", "User already exists");
      const usersAtEnd = await User.find({});
      expect(usersAtEnd).toHaveLength(1);
    });
  });
});

describe("POST /api/users/login", () => {
  beforeEach(async () => {
    await api.post("/api/users/signup").send(validUser).expect(201);
  });

  describe("when the credentials are valid", () => {
    it("should return status 200", async () => {
      await api.post("/api/users/login")
        .send({ username: validUser.username, password: validUser.password })
        .expect(200).expect("Content-Type", /application\/json/);
    });

    it("should return a username and token", async () => {
      const response = await api.post("/api/users/login")
        .send({ username: validUser.username, password: validUser.password }).expect(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.username).toBe(validUser.username);
      expect(response.body).not.toHaveProperty("password");
      expect(jwt.verify(response.body.token, config.SECRET).username).toBe(validUser.username);
    });
  });

  describe("when the credentials are invalid", () => {
    it("should return status 400 with a wrong password", async () => {
      const response = await api.post("/api/users/login")
        .send({ username: validUser.username, password: "WrongPassword!" }).expect(400);
      expect(response.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should return status 400 with a username that does not exist", async () => {
      const response = await api.post("/api/users/login")
        .send({ username: "nobody", password: validUser.password }).expect(400);
      expect(response.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should return status 400 when credentials are missing", async () => {
      await api.post("/api/users/login").send({ username: validUser.username }).expect(400);
    });
  });
});
