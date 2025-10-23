import { Routes, Route, Navigate } from "react-router-dom";

// pages
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ChooseRole from "./pages/ChooseRole.jsx";
import Account from "./pages/Account.jsx";
import BuyerHome from "./pages/BuyerHome.jsx";
import SellerHome from "./pages/SellerHome.jsx";
import CarDetails from "./pages/CarDetails.jsx";
import Inventory from "./pages/Inventory.jsx";   // ✅ only this stays

// layout
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/choose-role" element={<ChooseRole />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<Account />} />
          <Route path="/buyer" element={<BuyerHome />} />
          <Route path="/seller" element={<SellerHome />} />
          <Route path="/seller/inventory" element={<Inventory />} /> {/* ✅ new inventory */}
          <Route path="/cars/:id" element={<CarDetails />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}