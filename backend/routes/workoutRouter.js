const express = require('express');
const router = express.Router();
const {
  getAllWorkouts,
  createWorkout,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutControllers');
const requireAuth = require('../middleware/requireAuth');

// GET /api/workouts
router.get('/', getAllWorkouts);

// GET /api/workouts/:workoutId
router.get('/:workoutId', getWorkoutById);

// All routes below this point will require authentication
router.use(requireAuth); // Apply requireAuth middleware to all routes below

// POST /api/workouts
router.post('/', createWorkout);

// PUT /api/workouts/:workoutId
router.put('/:workoutId', updateWorkout);

// DELETE /api/workouts/:workoutId
router.delete('/:workoutId', deleteWorkout);

module.exports = router;

