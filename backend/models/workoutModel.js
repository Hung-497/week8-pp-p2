const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
});

// add virtual field id
workoutSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    return ret;
  }
});

module.exports = mongoose.model("Workout", workoutSchema);
