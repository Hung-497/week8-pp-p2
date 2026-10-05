import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddWorkoutPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const user = JSON.parse(localStorage.getItem("workoutUser"));
  const token = user ? user.token : null;

  const submitForm = async (e) => {
    e.preventDefault();
    const workout = Object.fromEntries(new FormData(e.currentTarget));
    workout.price = Number(workout.price);
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(workout),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add workout");
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="create">
      <h2>Add a New Workout</h2>
      <form onSubmit={submitForm}>
        <label htmlFor="title">Title:</label>
        <input id="title" name="title" type="text" required />
        <label htmlFor="difficulty">Difficulty:</label>
        <select id="difficulty" name="difficulty">
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <label htmlFor="description">Description:</label>
        <textarea id="description" name="description" required></textarea>
        <label htmlFor="price">Price:</label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
        />
        {error && <p role="alert">{error}</p>}
        <button disabled={pending}>
          {pending ? "Adding..." : "Add Workout"}
        </button>
      </form>
    </div>
  );
};

export default AddWorkoutPage;
