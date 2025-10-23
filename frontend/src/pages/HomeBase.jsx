// src/pages/HomeBase.jsx
import { useEffect, useMemo, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function HomeBase() {
  // always act like "buyer" — universal marketplace page
  const [qText, setQText] = useState("");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const runQuery = useMemo(() => qText.trim().toLowerCase(), [qText]);

  useEffect(() => {
    let cancel = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        let snap;
        // If your schema has createdAt, keep orderBy; otherwise remove it.
        try {
          const qRef = query(
            collection(db, "cars"),
            where("active", "==", true),
            orderBy("createdAt", "desc"),
            limit(60)
          );
          snap = await getDocs(qRef);
        } catch (e) {
          // fallback if index missing or no createdAt
          const qRef = query(collection(db, "cars"), where("active", "==", true), limit(60));
          snap = await getDocs(qRef);
        }

        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (runQuery) {
          items = items.filter(c =>
            [
              c.name, c.make, c.model, c.trim, c.year, c.dealershipName, c.city
            ].filter(Boolean).join(" ").toLowerCase().includes(runQuery)
          );
        }

        if (!cancel) setCars(items);
      } catch (e) {
        if (!cancel) setErr(e?.message || "Failed to load listings.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [runQuery]);

  return (
    <div className="container">
      {/* exact same buyer header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Browse Cars</h2>
      </div>

      <div className="formRow">
        <input
          className="input"
          placeholder="Search cars (make, model, city...)"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
        />
      </div>

      {loading && <p style={{ padding: 24 }}>Loading listings…</p>}
      {err && <p style={{ padding: 24, color: "salmon" }}>⚠ {err}</p>}
      {!loading && !err && cars.length === 0 && (
        <p style={{ padding: 24 }}>No active listings found.</p>
      )}

      <div className="grid">
        {cars.map((c) => (
          <div key={c.id} className="card">
            <img
              src={c.images?.[0] || c.imageUrl}
              alt={c.name || `${c.make} ${c.model}`}
              style={{ width: "100%", borderRadius: 10 }}
            />
            <h3>{c.name || `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`}</h3>
            <p>
              {[c.make, c.model, c.year].filter(Boolean).join(" • ")}
              {c.price ? ` • $${c.price}` : ""}
            </p>

            {/* SAME action for everyone */}
            <Link className="button" to={`/cars/${c.id}`}>View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}