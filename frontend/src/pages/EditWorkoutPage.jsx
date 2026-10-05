import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditWorkoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const user = JSON.parse(localStorage.getItem("workoutUser"));
  const token = user ? user.token : null;

  useEffect(() => {
    const fetchWorkout = async () => {
      setWorkout(null);
      setError("");
      try {
        const response = await fetch(`/api/workouts/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load workout");
        setWorkout(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchWorkout();
  }, [id]);

  const submitForm = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.price = Number(values.price);
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update workout");
      navigate(`/workouts/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  if (!workout) return error ? <p role="alert">{error}</p> : <p>Loading workout...</p>;

  return (
    <div className="create">
      <h2>Update Workout</h2>
      <form onSubmit={submitForm} key={id}>
        <label htmlFor="title">Title:</label>
        <input id="title" name="title" defaultValue={workout.title} required />
        <label htmlFor="difficulty">Difficulty:</label>
        <select id="difficulty" name="difficulty" defaultValue={workout.difficulty}>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <label htmlFor="description">Description:</label>
        <textarea id="description" name="description" defaultValue={workout.description} required />
        <label htmlFor="price">Price:</label>
        <input id="price" name="price" type="number" min="0" step="0.01" defaultValue={workout.price} required />
        {error && <p role="alert">{error}</p>}
        <button disabled={pending}>{pending ? "Saving..." : "Save Workout"}</button>
      </form>
    </div>
  );
};

export default EditWorkoutPage;
