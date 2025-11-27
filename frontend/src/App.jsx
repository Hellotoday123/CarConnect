import { Routes, Route, Navigate } from "react-router-dom";

// pages (public)
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ChooseRole from "./pages/ChooseRole.jsx";

// pages (protected)
import Account from "./pages/Account.jsx";
import BuyerHome from "./pages/BuyerHome.jsx";
import SellerHome from "./pages/SellerHome.jsx";
import CarDetails from "./pages/CarDetails.jsx";
import Inventory from "./pages/Inventory.jsx";
import Wishlist from "./pages/WishList.jsx";
import Checkout from "./pages/Checkout.jsx";
import SellerTestDrives from "./pages/SellerTestDrives.jsx";
import SellerSales from "./pages/SellerSales.jsx";
import MyTestDrives from "./pages/MyTestDrives.jsx";   // ✅ NEW BUYER PAGE
import MyPurchases from "./pages/MyPurchases.jsx";     // ✅ NEW SHARED PAGE

// layout
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  return (
    <div className="app">
      <Navbar />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/choose-role" element={<ChooseRole />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          {/* shared */}
          <Route path="/account" element={<Account />} />

          {/* buyer */}
          <Route path="/buyer" element={<BuyerHome />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/my-test-drives" element={<MyTestDrives />} /> {/* ✅ NEW */}
          <Route path="/checkout/:carId" element={<Checkout />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route path="/my-purchases" element={<MyPurchases />} />

          {/* seller */}
          <Route path="/seller" element={<SellerHome />} />
          <Route path="/seller/inventory" element={<Inventory />} />
          <Route path="/seller/test-drives" element={<SellerTestDrives />} />
          <Route path="/seller/sales" element={<SellerSales />} />
        </Route>

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
