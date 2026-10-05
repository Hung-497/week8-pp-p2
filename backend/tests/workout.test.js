const Workout = require("../models/workoutModel");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");

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

beforeAll(async () => {
  if (!process.env.TEST_MONGO_URI || process.env.TEST_MONGO_URI === process.env.MONGO_URI) {
    throw new Error("Set TEST_MONGO_URI to a separate disposable test database.");
  }
  await connectDB();
});

beforeEach(async () => {
  await Workout.deleteMany({});
  await Workout.insertMany(workouts);
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
    await api
      .get("/api/workouts")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should include a specific workout in the returned list", async () => {
    const response = await api.get("/api/workouts");

    expect(response.body.map((workout) => workout.title)).toContain(
      "30-Day Fat Burn",
    );
  });
});

describe("POST /api/workouts", () => {
  describe("when the payload is valid", () => {
    it("should return status 201", async () => {
      const newWorkout = {
        title: "Core Strength",
        difficulty: "Advanced",
        description: "A routine for core muscles and stability.",
        price: 39.99,
      };

      await api.post("/api/workouts").send(newWorkout).expect(201);
    });

    it("should persist the new workout in the database", async () => {
      const newWorkout = {
        title: "Core Strength",
        difficulty: "Advanced",
        description: "A routine for core muscles and stability.",
        price: 39.99,
      };

      await api.post("/api/workouts").send(newWorkout).expect(201);

      const workoutsAfterPost = await Workout.find({});
      expect(workoutsAfterPost).toHaveLength(workouts.length + 1);
      expect(workoutsAfterPost.map((workout) => workout.title)).toContain(
        newWorkout.title,
      );
    });
  });

  describe("when the payload is invalid", () => {
    it("should return status 400 when title is missing", async () => {
      const invalidWorkout = {
        difficulty: "Advanced",
        description: "Missing title should fail.",
        price: 19.99,
      };

      await api.post("/api/workouts").send(invalidWorkout).expect(400);
    });

    it("should not increase the number of workouts in the database", async () => {
      const invalidWorkout = {
        difficulty: "Advanced",
        description: "Missing title should fail.",
        price: 19.99,
      };

      await api.post("/api/workouts").send(invalidWorkout).expect(400);

      const workoutsAtEnd = await Workout.find({});
      expect(workoutsAtEnd).toHaveLength(workouts.length);
    });
  });
});

describe("GET /api/workouts/:workoutId", () => {
  describe("when the id is valid", () => {
    it("should return one workout by ID", async () => {
      const workout = await Workout.findOne();

      const response = await api
        .get(`/api/workouts/${workout._id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(response.body.title).toBe(workout.title);
      expect(response.body.difficulty).toBe(workout.difficulty);
      expect(response.body.description).toBe(workout.description);
      expect(response.body.price).toBe(workout.price);
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

      const response = await api
        .put(`/api/workouts/${workout._id}`)
        .send({ title: "Updated Workout", price: 42 })
        .expect(200);
      expect(response.body.title).toBe("Updated Workout");
      expect(response.body.price).toBe(42);
    });

    it("should persist the updated fields in the database", async () => {
      const workout = await Workout.findOne();
      const updates = {
        title: "Updated Workout",
        price: 42,
      };

      await api.put(`/api/workouts/${workout._id}`).send(updates).expect(200);

      const updatedWorkout = await Workout.findById(workout._id);
      expect(updatedWorkout.title).toBe(updates.title);
      expect(updatedWorkout.price).toBe(updates.price);
    });
  });

  describe("when the payload is invalid", () => {
    it("should return status 400 for an empty title", async () => {
      const workout = await Workout.findOne();
      await api.put(`/api/workouts/${workout._id}`).send({ title: "" }).expect(400);
    });

    it("should not change the workout in the database", async () => {
      const workout = await Workout.findOne();
      await api.put(`/api/workouts/${workout._id}`).send({ title: "" }).expect(400);
      const workoutAtEnd = await Workout.findById(workout._id);
      expect(workoutAtEnd.title).toBe(workout.title);
    });

    it("should return status 400 for a nonnumeric price", async () => {
      const workout = await Workout.findOne();
      await api.put(`/api/workouts/${workout._id}`).send({ price: "invalid" }).expect(400);
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await api.put(`/api/workouts/${nonExistentId}`).send({ price: 42 }).expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 400", async () => {
      await api.put("/api/workouts/12345").send({}).expect(400);
    });
  });
});

describe("DELETE /api/workouts/:workoutId", () => {
  describe("when the id is valid", () => {
    it("should return status 204", async () => {
      const workout = await Workout.findOne();

      const response = await api.delete(`/api/workouts/${workout._id}`).expect(204);
      expect(response.text).toBe("");
    });

    it("should remove the workout from the database", async () => {
      const workout = await Workout.findOne();

      await api.delete(`/api/workouts/${workout._id}`).expect(204);

      const deletedWorkout = await Workout.findById(workout._id);
      expect(deletedWorkout).toBeNull();
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await api.delete(`/api/workouts/${nonExistentId}`).expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 400", async () => {
      await api.delete("/api/workouts/12345").expect(400);
    });
  });
});
