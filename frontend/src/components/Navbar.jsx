import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  // Close dropdown on route change
  useEffect(() => { setOpen(false); }, [loc.pathname]);

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
      <div className="brand" onClick={goHome} style={{ cursor: "pointer" }}>
        CarConnect
      </div>

      <div className="links">
        {role === "buyer" && <Link to="/buyer" className="nav-link">Home</Link>}
        {role === "seller" && <Link to="/seller" className="nav-link">Home</Link>}
        {role && <Link to="/account" className="nav-link">Account</Link>}

        {role === "seller" && (
          <div className="nav-dropdown" ref={menuRef}>
            <button
              className="nav-icon"
              onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              ☰
            </button>

            {open && (
              <div className="nav-menu" role="menu">
                {/* ✅ My Cars → Inventory page */}
                <button className="nav-menu-item" onClick={() => nav("/seller/inventory")}>
                  My Cars
                </button>

                <button className="nav-menu-item" onClick={() => nav("/sales")}>
                  Sales
                </button>

                <button className="nav-menu-item" onClick={() => nav("/requests")}>
                  Requests
                </button>
              </div>
            )}
          </div>
        )}

        {role ? (
          <button className="nav-link" onClick={logout}>Logout</button>
        ) : (
          <Link to="/login" className="nav-link">Login</Link>
        )}
      </div>
    </nav>
  );
}