import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import SignupPage from "./pages/SignupPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

// pages & components
import Home from "./pages/HomePage";
import AddWorkoutPage from "./pages/AddWorkoutPage";
import WorkoutPage from "./pages/WorkoutPage";
import EditWorkoutPage from "./pages/EditWorkoutPage";
import Navbar from "./components/Navbar";
import NotFoundPage from "./pages/NotFoundPage";

const App = () => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("workoutUser")) || null;
    } catch {
      return null;
    }
  });
  const loginUser = (value) => {
    localStorage.setItem("workoutUser", JSON.stringify(value));
    setUser(value);
  };
  const logoutUser = () => {
    localStorage.removeItem("workoutUser");
    setUser(null);
  };
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar user={user} onLogout={logoutUser} />
        <div className="content">
          <Routes>
            <Route path="/signup" element={<SignupPage onLogin={loginUser} />} />
            <Route path="/login" element={<LoginPage onLogin={loginUser} />} />
            <Route path="/" element={<Home />} />
            <Route path="/add-workout" element={<AddWorkoutPage />} />
            <Route path="/workouts/:id" element={<WorkoutPage />} />
            <Route path="/edit-workout/:id" element={<EditWorkoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
};

export default App;
