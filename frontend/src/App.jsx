import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Account from './pages/Account.jsx';
import BuyerHome from './pages/BuyerHome.jsx';
import SellerHome from './pages/SellerHome.jsx';
import CarDetails from './pages/CarDetails.jsx';
import AddEditCar from './pages/AddEditCar.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';


export default function App() {
return (
<div className="app">
<Navbar />
<Routes>
<Route path="/" element={<Navigate to="/login" />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/forgot" element={<ForgotPassword />} />


{/* Auth-only */}
<Route element={<ProtectedRoute />}>
<Route path="/account" element={<Account />} />
<Route path="/buyer" element={<BuyerHome />} />
<Route path="/seller" element={<SellerHome />} />
<Route path="/cars/:id" element={<CarDetails />} />
<Route path="/seller/cars/:id?" element={<AddEditCar />} />
</Route>
</Routes>
</div>
);
}