import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import TestDriveNotificationBell from "./TestDriveNotificationBell.jsx";

export default function Navbar() {
  const [role, setRole] = useState(null); // "buyer" | "seller" | null
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const menuRef = useRef(null);

  // Load user role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return setRole(null);
      const snap = await getDoc(doc(db, "users", u.uid));
      setRole(snap.data()?.role ?? null);
    });
    return () => unsub();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  // Close dropdown when route changes
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const logout = async () => {
    await signOut(auth);
    nav("/login");
  };

  const goHome = () => {
    if (role === "buyer") nav("/buyer");
    else if (role === "seller") nav("/seller");
    else nav("/login");
  };

  return (
    <nav className="nav">
      {/* Brand */}
      <div className="brand" onClick={goHome} style={{ cursor: "pointer" }}>
        CarConnect
      </div>

      <div className="links">
        {/* Home link per role */}
        {role === "buyer" && (
          <Link to="/buyer" className="nav-link">
            Home
          </Link>
        )}

        {role === "seller" && (
          <Link to="/seller" className="nav-link">
            Home
          </Link>
        )}

        {/* Wishlist visible for ANY logged-in user */}
        {role && (
          <Link to="/wishlist" className="nav-link">
            Wishlist
          </Link>
        )}

        {/* Account link for all logged-in users */}
        {role && (
          <Link to="/account" className="nav-link">
            Account
          </Link>
        )}

        {/* SELLER: notification bell stays visible */}
        {role === "seller" && <TestDriveNotificationBell />}

        {/* DROPDOWN – different content for buyer vs seller */}
        {role && (
          <div className="nav-dropdown" ref={menuRef}>
            <button
              className="nav-icon"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              ☰
            </button>

            {open && (
              <div className="nav-menu" role="menu">
                {/* Buyer-only items */}
                {role === "buyer" && (
                  <>
                    <button
                      className="nav-menu-item"
                      onClick={() => nav("/my-test-drives")}
                    >
                      My Test Drives
                    </button>
                    <button
                      className="nav-menu-item"
                      onClick={() => nav("/my-purchases")}
                    >
                      My Purchases
                    </button>
                  </>
                )}

                {/* Seller-only items */}
                {role === "seller" && (
                  <>
                    <button
                      className="nav-menu-item"
                      onClick={() => nav("/seller/inventory")}
                    >
                      My Cars
                    </button>

                    <button
                      className="nav-menu-item"
                      onClick={() => nav("/seller/sales")}
                    >
                      Sales
                    </button>

                    <button
                      className="nav-menu-item"
                      onClick={() => nav("/seller/test-drives")}
                    >
                      Test Drive Requests
                    </button>

                    <button
                      className="nav-menu-item"
                      onClick={() => nav("/my-purchases")}
                    >
                      My Purchases
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Login / Logout */}
        {role ? (
          <button className="nav-link" onClick={logout}>
            Logout
          </button>
        ) : (
          <Link to="/login" className="nav-link">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
