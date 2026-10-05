import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const AuthForm = ({ signup = false, onLogin }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitForm = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    setPending(true);
    try {
      const response = await fetch(`/api/users/${signup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed");
      onLogin(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="create">
      <h2>{signup ? "Sign Up" : "Log In"}</h2>
      <form onSubmit={submitForm}>
        <label htmlFor="username">Username:</label>
        <input id="username" name="username" autoComplete="username" required />
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required />
        {signup && <>
          <label htmlFor="name">Full Name:</label>
          <input id="name" name="name" autoComplete="name" required />
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" required />
          <label htmlFor="role">Role:</label>
          <select id="role" name="role" defaultValue="user">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </>}
        {error && <p role="alert">{error}</p>}
        <button disabled={pending}>{pending ? "Submitting..." : signup ? "Sign Up" : "Log In"}</button>
      </form>
      <Link to={signup ? "/login" : "/signup"}>{signup ? "Log In" : "Sign Up"}</Link>
    </div>
  );
};

export default AuthForm;