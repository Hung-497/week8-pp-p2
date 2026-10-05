const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Workout = require("../models/workoutModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const config = require("../utils/config");

const api = supertest(app);

const workouts = [
  {
    title: "30-Day Fat Burn",
    difficulty: "Beginner",
    description: "A full body routine for fitness and fat loss.",
    price: 29.99,
  },
  {
    title: "Upper Body Blast",
    difficulty: "Advanced",
    description: "A strength routine for upper body muscles.",
    price: 49.99,
  },
];

const userData = {
  username: "protected.workout.tester",
  password: "Workout123!",
  phoneNumber: "+358409876543",
  name: "Protected Workout Tester",
  role: "user",
};

const workoutsInDb = async () => {
  const workouts = await Workout.find({});
  return workouts.map((workout) => workout.toJSON());
};

let token = null;
let userId = null;

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({});
  await Workout.deleteMany({});
  const signupResponse = await api
    .post("/api/users/signup")
    .send(userData)
    .expect(201);
  token = signupResponse.body.token;
  const user = await User.findOne({ username: userData.username });
  userId = user.id;
});

beforeEach(async () => {
  await Workout.deleteMany({});
  for (const workout of workouts) {
    await api.post("/api/workouts")
      .set("Authorization", `Bearer ${token}`)
      .send(workout)
      .expect(201);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /api/workouts", () => {
  it("should return all workouts", async () => {
    const response = await api.get("/api/workouts").expect(200);
    expect(response.body).toHaveLength(workouts.length);
  });

  it("should return workouts as JSON with status 200", async () => {
    await api.get("/api/workouts").expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should include a specific workout in the returned list", async () => {
    const response = await api.get("/api/workouts");
    expect(response.body.map((workout) => workout.title)).toContain("30-Day Fat Burn");
  });
});

describe("POST /api/workouts", () => {
  describe("when the payload is valid", () => {
    it("should return status 201", async () => {
      const newWorkout = {
        title: "Core Strength",
        difficulty: "Intermediate",
        description: "A routine for core muscles and stability.",
        price: 39.99,
      };
      await api.post("/api/workouts").set("Authorization", `Bearer ${token}`).send(newWorkout).expect(201);
    });

    it("should persist the new workout in the database", async () => {
      const newWorkout = {
        title: "Core Strength",
        difficulty: "Intermediate",
        description: "A routine for core muscles and stability.",
        price: 39.99,
      };
      await api.post("/api/workouts").set("Authorization", `Bearer ${token}`).send(newWorkout).expect(201);
      const workoutsAfterPost = await Workout.find({});
      expect(workoutsAfterPost).toHaveLength(workouts.length + 1);
      expect(workoutsAfterPost.map((workout) => workout.title)).toContain(newWorkout.title);
    });
  });

  describe("when the payload is invalid", () => {
    it("should return status 400 when title is missing", async () => {
      const invalidWorkout = {
        difficulty: "Beginner",
        description: "Missing title should fail.",
        price: 19.99,
      };
      await api.post("/api/workouts").set("Authorization", `Bearer ${token}`).send(invalidWorkout).expect(400);
    });

    it("should not increase the number of workouts in the database", async () => {
      const invalidWorkout = {
        difficulty: "Beginner",
        description: "Missing title should fail.",
        price: 19.99,
      };
      await api.post("/api/workouts").set("Authorization", `Bearer ${token}`).send(invalidWorkout).expect(400);
      const workoutsAtEnd = await Workout.find({});
      expect(workoutsAtEnd).toHaveLength(workouts.length);
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401", async () => {
      await api.post("/api/workouts").send(workouts[0]).expect(401);
    });

    it("should not increase the number of workouts in the database", async () => {
      await api.post("/api/workouts").send(workouts[0]).expect(401);
      const workoutsAtEnd = await workoutsInDb();
      expect(workoutsAtEnd).toHaveLength(workouts.length);
    });
  });

  describe("when the token is invalid", () => {
    it("should reject a malformed token without creating a workout", async () => {
      await api.post("/api/workouts")
        .set("Authorization", "Bearer invalidtoken")
        .send(workouts[0]).expect(401);
      const workoutsAtEnd = await workoutsInDb();
      expect(workoutsAtEnd).toHaveLength(workouts.length);
    });

    it("should reject an expired token without creating a workout", async () => {
      const expiredToken = jwt.sign({ id: userId }, config.SECRET, { expiresIn: -1 });
      await api.post("/api/workouts")
        .set("Authorization", `Bearer ${expiredToken}`)
        .send(workouts[0]).expect(401);
      const workoutsAtEnd = await workoutsInDb();
      expect(workoutsAtEnd).toHaveLength(workouts.length);
    });

    it("should reject a token signed with a different secret", async () => {
      const invalidToken = jwt.sign({ id: userId }, "different-test-secret", { expiresIn: "1h" });
      await api.post("/api/workouts")
        .set("Authorization", `Bearer ${invalidToken}`)
        .send(workouts[0]).expect(401);
    });

    it("should reject a token for a user that no longer exists", async () => {
      const signupResponse = await api.post("/api/users/signup")
        .send({ ...userData, username: "deleted.workout.tester" }).expect(201);
      await User.deleteOne({ username: "deleted.workout.tester" });
      await api.post("/api/workouts")
        .set("Authorization", `Bearer ${signupResponse.body.token}`)
        .send(workouts[0]).expect(401);
      const workoutsAtEnd = await workoutsInDb();
      expect(workoutsAtEnd).toHaveLength(workouts.length);
    });
  });
});

describe("GET /api/workouts/:workoutId", () => {
  describe("when the id is valid", () => {
    it("should return one workout by ID", async () => {
      const workout = await Workout.findOne();
      const response = await api.get(`/api/workouts/${workout._id}`)
        .expect(200).expect("Content-Type", /application\/json/);
      expect(response.body.title).toBe(workout.title);
      expect(response.body.difficulty).toBe(workout.difficulty);
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await api.get(`/api/workouts/${nonExistentId}`).expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 400", async () => {
      await api.get("/api/workouts/12345").expect(400);
    });
  });
});

describe("PUT /api/workouts/:workoutId", () => {
  describe("when the id is valid", () => {
    it("should return status 200 with the updated values", async () => {
      const workout = await Workout.findOne();
      const response = await api.put(`/api/workouts/${workout._id}`).set("Authorization", `Bearer ${token}`)
        .send({ description: "Updated routine", price: 42 }).expect(200);
      expect(response.body.description).toBe("Updated routine");
      expect(response.body.price).toBe(42);
    });

    it("should persist the updated fields in the database", async () => {
      const workout = await Workout.findOne();
      const updates = { description: "Updated routine", price: 42 };
      await api.put(`/api/workouts/${workout._id}`).set("Authorization", `Bearer ${token}`).send(updates).expect(200);
      const updatedWorkout = await Workout.findById(workout._id);
      expect(updatedWorkout.description).toBe(updates.description);
      expect(updatedWorkout.price).toBe(updates.price);
    });
  });

  describe("when the payload is invalid", () => {
    it("should reject an empty title without changing the workout", async () => {
      const workout = await Workout.findOne();
      await api.put(`/api/workouts/${workout._id}`).set("Authorization", `Bearer ${token}`).send({ title: "" }).expect(400);
      const workoutAtEnd = await Workout.findById(workout._id);
      expect(workoutAtEnd.title).toBe(workout.title);
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await api.put(`/api/workouts/${nonExistentId}`).set("Authorization", `Bearer ${token}`).send({ price: 42 }).expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 400", async () => {
      await api.put("/api/workouts/12345").set("Authorization", `Bearer ${token}`).send({}).expect(400);
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401 without changing the workout", async () => {
      const workout = await Workout.findOne();
      await api.put(`/api/workouts/${workout._id}`)
        .send({ price: 1 }).expect(401);
      const workoutAtEnd = await Workout.findById(workout._id);
      expect(workoutAtEnd.price).toBe(workout.price);
    });
  });

  describe("when the token is invalid", () => {
    it("should reject a malformed token without changing the workout", async () => {
      const workout = await Workout.findOne();
      await api.put(`/api/workouts/${workout._id}`)
        .set("Authorization", "Bearer invalidtoken")
        .send({ price: 1 }).expect(401);
      const workoutAtEnd = await Workout.findById(workout._id);
      expect(workoutAtEnd.price).toBe(workout.price);
    });

    it("should reject an expired token without changing the workout", async () => {
      const workout = await Workout.findOne();
      const expiredToken = jwt.sign({ id: userId }, config.SECRET, { expiresIn: -1 });
      await api.put(`/api/workouts/${workout._id}`)
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ price: 1 }).expect(401);
      const workoutAtEnd = await Workout.findById(workout._id);
      expect(workoutAtEnd.price).toBe(workout.price);
    });
  });
});

describe("DELETE /api/workouts/:workoutId", () => {
  describe("when the id is valid", () => {
    it("should return status 204", async () => {
      const workout = await Workout.findOne();
      await api.delete(`/api/workouts/${workout._id}`).set("Authorization", `Bearer ${token}`).expect(204);
    });

    it("should remove the workout from the database", async () => {
      const workout = await Workout.findOne();
      await api.delete(`/api/workouts/${workout._id}`).set("Authorization", `Bearer ${token}`).expect(204);
      const deletedWorkout = await Workout.findById(workout._id);
      expect(deletedWorkout).toBeNull();
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await api.delete(`/api/workouts/${nonExistentId}`).set("Authorization", `Bearer ${token}`).expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 400", async () => {
      await api.delete("/api/workouts/12345").set("Authorization", `Bearer ${token}`).expect(400);
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401 without deleting the workout", async () => {
      const workout = await Workout.findOne();
      await api.delete(`/api/workouts/${workout._id}`).expect(401);
      const workoutsAtEnd = await workoutsInDb();
      expect(workoutsAtEnd).toHaveLength(workouts.length);
      expect(workoutsAtEnd.map((item) => item.id.toString())).toContain(workout.id);
    });
  });

  describe("when the token is invalid", () => {
    it("should reject a malformed token without deleting the workout", async () => {
      const workout = await Workout.findOne();
      await api.delete(`/api/workouts/${workout._id}`)
        .set("Authorization", "Bearer invalidtoken").expect(401);
      const workoutAtEnd = await Workout.findById(workout._id);
      expect(workoutAtEnd).not.toBeNull();
    });

    it("should reject an expired token without deleting the workout", async () => {
      const workout = await Workout.findOne();
      const expiredToken = jwt.sign({ id: userId }, config.SECRET, { expiresIn: -1 });
      await api.delete(`/api/workouts/${workout._id}`)
        .set("Authorization", `Bearer ${expiredToken}`).expect(401);
      const workoutAtEnd = await Workout.findById(workout._id);
      expect(workoutAtEnd).not.toBeNull();
    });
  });
});