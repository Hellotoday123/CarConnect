// src/pages/Wishlist.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import "../style.css";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const loadWishlist = async () => {
      const user = auth.currentUser;
      if (!user) {
        setErr("You must be logged in to view your wishlist.");
        setLoading(false);
        return;
      }

      try {
        const qRef = query(
          collection(db, "users", user.uid, "wishlist"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(qRef);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWishlist(items);
      } catch (e) {
        console.error(e);
        setErr("Failed to load wishlist.");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const removeFromWishlist = async (wishId) => {
    const user = auth.currentUser;
    if (!user) return;
    if (!confirm("Remove this car from your wishlist?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "wishlist", wishId));
      setWishlist((prev) => prev.filter((x) => x.id !== wishId));
    } catch (e) {
      console.error("Failed to remove wishlist item:", e);
      alert("Could not remove this item. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p>Loading wishlist...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container">
        <p style={{ color: "salmon" }}>{err}</p>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="container">
        <h2>Your Wishlist</h2>
        <p>You have no saved cars yet.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Your Wishlist</h2>

      <div className="grid">
        {wishlist.map((item) => (
          <div key={item.id} className="card">
            <img
              src={
                item.image ||
                "https://via.placeholder.com/400x250?text=No+Image"
              }
              alt={item.title}
              style={{ width: "100%", borderRadius: 10 }}
            />

            <h3>{item.title || "Unnamed Car"}</h3>
            {item.price != null && (
              <p>${Number(item.price).toLocaleString()}</p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Link to={`/cars/${item.carId}`} className="button">
                View
              </Link>
              <button
                onClick={() => removeFromWishlist(item.id)}
                className="button"
                style={{ background: "#ef4444", color: "white" }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}