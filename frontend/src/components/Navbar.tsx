import { Link, useNavigate } from "react-router-dom";
import { logout, getUser, isLoggedIn } from "../auth";

export default function Navbar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow p-4 flex justify-between">
      <Link to="/translate" className="font-bold">
        Dumbo
      </Link>
      <div>
        {isLoggedIn() && (
          <>
            <span className="mr-4">Hello, {getUser()}</span>
            <button onClick={handleLogout} className="text-blue-600">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}