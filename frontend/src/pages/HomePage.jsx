import WorkoutListings from "../components/WorkoutListings";
import { useState, useEffect } from "react";

const Home = () => {
  const [workouts, setWorkouts] = useState(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const res = await fetch("/api/workouts");
                if (!res.ok) throw new Error("Could not fetch workouts");
                const data = await res.json();
                setWorkouts(data)
                setIsPending(false);
            } catch (error) {
                setError(error.message);
                setIsPending(false);
            }
        };

        fetchWorkouts();
    }, []);
  return (
    <div className="home">
      {error && <p role="alert">{error}</p>}
      {isPending && <p>Loading workouts...</p>}
      {workouts && <WorkoutListings workouts={workouts} />}
    </div>
  );
};

export default Home;

