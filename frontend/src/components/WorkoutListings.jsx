import { useEffect, useState } from "react";
import WorkoutListing from "./WorkoutListing";

const WorkoutListings = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/workouts", { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load workouts");
        setWorkouts(data);
        setLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, []);

  if (loading) return <p>Loading workouts...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div className="workout-list">
      {workouts.length === 0 && <p>No workouts yet.</p>}
      {workouts.map((workout) => (
        <WorkoutListing key={workout._id} workout={workout} />
      ))}
    </div>
  );
};

export default WorkoutListings;
