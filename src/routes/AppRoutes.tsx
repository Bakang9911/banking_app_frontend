import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import CustomerDashboard from "../pages/CustomerDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRole="CUSTOMER" />}>
        <Route path="/dashboard" element={<CustomerDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
