import { Link } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/">
        <h1>Workout</h1>
      </Link>
      <div className="links">
        <Link to="/">Home</Link>
        {user ? (
          <>
            <Link to="/add-workout">Add Workout</Link>
            <span>
              {user.username} ({user.role})
            </span>
            <button type="button" onClick={onLogout}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log In</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
