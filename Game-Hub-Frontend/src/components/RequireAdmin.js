// components/RequireAdmin.js
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const RequireAdmin = ({ children }) => {
  const { user, loadingUser } = useUser();

  if (loadingUser) return null;

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAdmin;
