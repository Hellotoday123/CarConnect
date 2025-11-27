// src/pages/SellerSales.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../style.css";

export default function SellerSales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBestCars, setShowBestCars] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const qRef = query(
          collection(db, "orders"),
          where("sellerId", "==", user.uid)
        );
        const snap = await getDocs(qRef);

        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setOrders(list);
      } catch (err) {
        console.error("Failed to load sales:", err);
      } finally {
        setLoading(false);
      }
    })();
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

  // --- Compute best-selling cars (top 5) ---
  const carStats = {};
  for (const o of orders) {
    const name = o.carName || "Unknown";
    if (!carStats[name]) carStats[name] = { carName: name, count: 0, revenue: 0 };
    const price = typeof o.price === "number" ? o.price : Number(o.price) || 0;
    carStats[name].count += 1;
    carStats[name].revenue += price;
  }

  const topCars = Object.values(carStats)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.revenue - a.revenue;
    })
    .slice(0, 5);

  return (
    <div className="page-wrap">
      <h1 className="page-title">Sales & Receipts</h1>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">Total sales</div>
          <div className="stat-value">{orders.length}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Total revenue</div>
          <div className="stat-value">
            {fmtMoney(orders.reduce((s, o) => s + (Number(o.price) || 0), 0))}
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Best-selling cars</div>
          <button
            className="primary-btn"
            style={{ marginTop: 8 }}
            onClick={() => setShowBestCars((v) => !v)}
          >
            {showBestCars ? "Hide best cars" : "Show best cars"}
          </button>
        </div>
      </div>

      {/* Top 5 Best Cars */}
      {showBestCars && topCars.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 className="card-title">Top 5 Best-Selling Cars</h2>

          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Car</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topCars.map((car, i) => (
                <tr key={car.carName}>
                  <td>{i + 1}</td>
                  <td>{car.carName}</td>
                  <td>{car.count}</td>
                  <td>{fmtMoney(car.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Table */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="card-title">Orders (Receipts)</h2>

        {loading ? (
          <p>Loading sales…</p>
        ) : orders.length === 0 ? (
          <p>You have no sales yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Car</th>
                <th>Buyer Email</th>
                <th>Price</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.carName || "Car"}</td>
                  <td>{o.buyerEmail || "-"}</td>
                  <td>{fmtMoney(o.price)}</td>
                  <td>{fmtDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
