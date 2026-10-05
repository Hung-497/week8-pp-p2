const express = require('express');
const router = express.Router();
const {
  getAllWorkouts,
  createWorkout,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutControllers');

// GET /api/workouts
router.get('/', getAllWorkouts);

// POST /api/workouts
router.post('/', createWorkout);

// GET /api/workouts/:workoutId
router.get('/:workoutId', getWorkoutById);

// PUT /api/workouts/:workoutId
router.put('/:workoutId', updateWorkout);

// DELETE /api/workouts/:workoutId
router.delete('/:workoutId', deleteWorkout);

module.exports = router;

