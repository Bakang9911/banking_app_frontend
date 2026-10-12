import { Navigate, Outlet } from "react-router-dom";
import { getRole, getToken } from "../services/storageService";

interface ProtectedRouteProps {
  allowedRole?: string;
}

function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const token = getToken();
  const role = getRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    if (role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
