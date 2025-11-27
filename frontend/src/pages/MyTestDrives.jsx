import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import "../style.css";

export default function MyTestDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDrives = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const qRef = query(
      collection(db, "testDrives"),
      where("buyerId", "==", user.uid)
    );

    const snap = await getDocs(qRef);
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // ❌ Remove cancelled after refresh
    list = list.filter((d) => d.status !== "cancelled");

    // sort newest → oldest
    list.sort((a, b) => {
      const ta = a.requestedAt?.toMillis?.() || 0;
      const tb = b.requestedAt?.toMillis?.() || 0;
      return tb - ta;
    });

    setDrives(list);
    setLoading(false);
  };

  useEffect(() => {
    loadDrives();
  }, []);

  const cancelDrive = async (id) => {
    await updateDoc(doc(db, "testDrives", id), {
      status: "cancelled",
      updatedAt: serverTimestamp(),
    });

    setDrives((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "cancelled" } : d))
    );
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">My Test Drives</h1>
        <p className="page-status">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">My Test Drives</h1>

      {drives.length === 0 ? (
        <p>You have not booked any test drives yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Car</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {drives.map((d) => (
              <tr key={d.id}>
                <td>{d.carName}</td>
                <td>{d.dateTime}</td>
                <td className={`status ${d.status}`}>{d.status}</td>
                <td>
                  {(d.status === "pending" || d.status === "accepted") ? (
                    <button
                      className="ghost-btn small"
                      onClick={() => cancelDrive(d.id)}
                    >
                      Cancel
                    </button>
                  ) : (
                    <span style={{ color: "#6b7280", fontSize: 13 }}>
                      No action
                    </span>
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
