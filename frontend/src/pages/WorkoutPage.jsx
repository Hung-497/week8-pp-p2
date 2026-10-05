import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const WorkoutPage = ({isAuthenticated}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const user = JSON.parse(localStorage.getItem("workoutUser"));
  const token = user ? user.token : null;

  useEffect(() => {
    const fetchWorkout = async () => {
      setWorkout(null);
      setError("");
      try {
        const response = await fetch(`/api/workouts/${id}`);
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load workout");
        setWorkout(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchWorkout();
  }, [id]);

  const deleteWorkout = async () => {
    if (!window.confirm("Delete this workout?")) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not delete workout");
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!workout)
    return error ? <p role="alert">{error}</p> : <p>Loading workout...</p>;

  return (
    <div className="workout-preview">
      <Link to="/">Back to workouts</Link>
      <h2>{workout.title}</h2>
      <p>Difficulty: {workout.difficulty}</p>
      <p>{workout.description}</p>
      <p>Price: ${workout.price.toFixed(2)}</p>
      {error && <p role="alert">{error}</p>}
      {isAuthenticated && (
        <div className="workout-actions">
          <button type="button" onClick={() => navigate(`/edit-workout/${id}`)}>
            Edit Workout
          </button>
          <button type="button" onClick={deleteWorkout} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Workout"}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutPage;
