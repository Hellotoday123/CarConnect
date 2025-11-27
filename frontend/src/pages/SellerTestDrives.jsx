import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,          // 👈 NEW: to find notifications
} from "firebase/firestore";
import "../style.css";

export default function SellerTestDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "testDrives"),
      where("sellerId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // ❌ Hide cancelled, rejected, and done in this "active" view
        list = list.filter(
          (d) =>
            d.status !== "cancelled" &&
            d.status !== "rejected" &&
            d.status !== "done"
        );

        // newest first
        list.sort((a, b) => {
          const ta = a.requestedAt?.toMillis?.() || 0;
          const tb = b.requestedAt?.toMillis?.() || 0;
          return tb - ta;
        });

        setDrives(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading test drive requests:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      // 1) update the test drive status
      await updateDoc(doc(db, "testDrives", id), {
        status,
        updatedAt: serverTimestamp(),
      });

      // 2) mark related notifications as read so the bell count goes down
      const user = auth.currentUser;
      if (user) {
        const notifQ = query(
          collection(db, "notifications"),
          where("sellerId", "==", user.uid),
          where("testDriveId", "==", id),
          where("read", "==", false)
        );

        const notifSnap = await getDocs(notifQ);
        const updates = notifSnap.docs.map((n) =>
          updateDoc(doc(db, "notifications", n.id), {
            read: true,
            readAt: serverTimestamp(),
          })
        );
        await Promise.all(updates);
      }

      // 3) update UI list
      if (
        status === "rejected" ||
        status === "cancelled" ||
        status === "done"
      ) {
        // remove from table immediately
        setDrives((prev) => prev.filter((d) => d.id !== id));
      } else {
        // e.g. pending -> accepted
        setDrives((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status } : d))
        );
      }
    } catch (err) {
      console.error("Update status error:", err);
      alert("Failed to update status. Try again.");
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Customer Test Drive Requests</h1>
        <p className="page-status">Loading requests…</p>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">Customer Test Drive Requests</h1>

      {drives.length === 0 ? (
        <p>No active test drive requests.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Car</th>
              <th>Buyer</th>
              <th>Date/Time</th>
              <th>Status</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drives.map((d) => (
              <tr key={d.id}>
                <td>{d.carName}</td>
                <td>{d.buyerEmail || d.buyerId}</td>
                <td>{d.dateTime}</td>
                <td className={`status ${d.status}`}>{d.status}</td>
                <td>
                  {/* PENDING: Accept + Reject */}
                  {d.status === "pending" && (
                    <>
                      <button
                        className="primary-btn small"
                        style={{ marginRight: 6 }}
                        onClick={() => updateStatus(d.id, "accepted")}
                      >
                        Accept
                      </button>
                      <button
                        className="ghost-btn small"
                        onClick={() => updateStatus(d.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* ACCEPTED: Done + Reject */}
                  {d.status === "accepted" && (
                    <>
                      <button
                        className="primary-btn small"
                        style={{ marginRight: 6, background: "#10b981" }}
                        onClick={() => updateStatus(d.id, "done")}
                      >
                        Done
                      </button>
                      <button
                        className="ghost-btn small"
                        onClick={() => updateStatus(d.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
