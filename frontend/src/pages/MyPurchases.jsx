import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../style.css";

export default function MyPurchases() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        // 🔹 only query by buyerId – this matches your Firestore rules
        const qRef = query(
          collection(db, "orders"),
          where("buyerId", "==", user.uid)
        );
        const snap = await getDocs(qRef);

        const results = [];

        for (const d of snap.docs) {
          const data = d.data();
          let carDoc = null;

          if (data.carId) {
            try {
              const carSnap = await getDoc(doc(db, "cars", data.carId));
              if (carSnap.exists()) {
                carDoc = { id: carSnap.id, ...carSnap.data() };
              }
            } catch (err) {
              console.warn("Failed to load car for order", d.id, err);
            }
          }

          results.push({
            id: d.id,
            ...data,
            car: carDoc,
          });
        }

        setOrders(results);
      } catch (err) {
        console.error("Load purchases error:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const fmtMoney = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : n;

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  };

  return (
    <div className="page-wrap">
      <h1 className="page-title">My Purchases</h1>

      {loading ? (
        <p>Loading purchases…</p>
      ) : orders.length === 0 ? (
        <div className="card">
          <p>You have not purchased any cars yet.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Car</th>
                <th>Price</th>
                <th>Date</th>
                <th>Receipt #</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const carTitle =
                  o.carName ||
                  o.car?.name ||
                  [o.car?.year, o.car?.make, o.car?.model]
                    .filter(Boolean)
                    .join(" ") ||
                  "Car";

                return (
                  <tr key={o.id}>
                    <td>{carTitle}</td>
                    <td>{fmtMoney(o.price)}</td>
                    <td>{fmtDate(o.createdAt)}</td>
                    <td>{o.id}</td>
                    <td>
                      {o.cardLast4 ? `**** **** **** ${o.cardLast4}` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
