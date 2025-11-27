// src/pages/WishList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import "../style.css";

export default function WishList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const user = auth.currentUser;
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const qRef = query(
          collection(db, "wishlists"),
          where("buyerId", "==", user.uid)
        );
        const snap = await getDocs(qRef);

        const results = [];

        for (const d of snap.docs) {
          const data = d.data();
          const carId = data.carId;
          let carDoc = null;

          if (carId) {
            const carSnap = await getDoc(doc(db, "cars", carId));
            if (carSnap.exists()) {
              carDoc = { id: carSnap.id, ...carSnap.data() };
            }
          }

          const title =
            data.title ||
            [carDoc?.year, carDoc?.make, carDoc?.model]
              .filter(Boolean)
              .join(" ") ||
            "Car";

          const price =
            data.price ??
            carDoc?.price ??
            null;

          const image =
            data.image ||
            carDoc?.imageUrl ||
            (carDoc?.images && carDoc.images[0]) ||
            "https://via.placeholder.com/400x250?text=Car";

          results.push({
            id: d.id, // wishlist doc id
            carId,
            title,
            price,
            image,
            make: carDoc?.make || "",
            model: carDoc?.model || "",
            year: carDoc?.year || "",
            mileage: carDoc?.mileage,
            condition: carDoc?.condition, // "new" / "used" if you have it
          });
        }

        if (!cancelled) {
          setItems(results);
          setLoading(false);
        }
      } catch (err) {
        console.error("Load wishlist error:", err);
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const fmtMoney = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : n;

  const removeItem = async (wishlistId) => {
    try {
      await deleteDoc(doc(db, "wishlists", wishlistId));
      setItems((prev) => prev.filter((it) => it.id !== wishlistId));
    } catch (err) {
      console.error("Remove from wishlist error:", err);
      alert("Failed to remove car from wishlist. Please try again.");
    }
  };

  return (
    <div className="page-wrap">
      <h1 className="page-title">Your Wishlist</h1>

      {loading ? (
        <p>Loading wishlist…</p>
      ) : items.length === 0 ? (
        <div className="card">
          <p>You have no saved cars yet.</p>
        </div>
      ) : (
        <div className="wishlist-grid cards-grid">
          {items.map((car) => (
            <div key={car.id} className="car-card">
              <div className="car-card-img">
                <img src={car.image} alt={car.title} />
              </div>

              <div className="car-card-body">
                <h2 className="car-card-title">{car.title}</h2>

                <div className="car-card-subtitle">
                  {[car.make, car.model, car.year]
                    .filter(Boolean)
                    .join(" • ")}
                  {car.price && ` • ${fmtMoney(car.price)}`}
                </div>

                <div className="car-card-meta">
                  {car.mileage != null && (
                    <span>• {Number(car.mileage).toLocaleString()} km</span>
                  )}
                  {car.condition && (
                    <span>• {car.condition}</span>
                  )}
                </div>

                <div className="car-card-actions">
                  {car.carId && (
                    <Link
                      to={`/cars/${car.carId}`}
                      className="primary-btn small"
                    >
                      View
                    </Link>
                  )}

                  <button
                    className="ghost-btn small"
                    onClick={() => removeItem(car.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
