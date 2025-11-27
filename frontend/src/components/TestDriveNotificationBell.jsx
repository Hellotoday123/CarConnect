import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function TestDriveNotificationBell() {
  const [count, setCount] = useState(0);
  const [sellerId, setSellerId] = useState(null);
  const navigate = useNavigate();

  // Listen to auth, then subscribe to notifications
  useEffect(() => {
    let unsubscribeNotifications = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // clear previous listener
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }

      if (!user) {
        setSellerId(null);
        setCount(0);
        return;
      }

      setSellerId(user.uid);

      const q = query(
        collection(db, "notifications"),
        where("sellerId", "==", user.uid),
        where("read", "==", false)
      );

      unsubscribeNotifications = onSnapshot(q, (snap) => {
        setCount(snap.docs.length);
      });
    });

    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
      unsubscribeAuth();
    };
  }, []);

  const markAllRead = async () => {
    if (!sellerId) return;

    const q = query(
      collection(db, "notifications"),
      where("sellerId", "==", sellerId),
      where("read", "==", false)
    );
    const snap = await getDocs(q);

    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(doc(db, "notifications", d.id), {
          read: true,
        })
      )
    );

    setCount(0);
  };

  const handleClick = async (e) => {
    e.preventDefault(); // prevent Link from navigating first
    await markAllRead();
    navigate("/seller/test-drives");
  };

  // No unread notifications – simple bell that just links
  if (count === 0) {
    return (
      <Link to="/seller/test-drives" className="nav-icon-link">
        🔔
      </Link>
    );
  }

  // Unread notifications – clickable bell with badge
  return (
    <button
      type="button"
      className="nav-notification-wrapper"
      onClick={handleClick}
      style={{ background: "transparent", border: "none", padding: 0 }}
    >
      <span className="nav-icon-link">
        🔔
        <span className="nav-notification-badge">{count}</span>
      </span>
    </button>
  );
}
