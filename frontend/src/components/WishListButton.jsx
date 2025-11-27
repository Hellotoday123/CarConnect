import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function WishlistButton({ carId, title, price, image }) {
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);

  const uid = auth.currentUser?.uid || null;

  // Check if this car is already in wishlist
  useEffect(() => {
    if (!uid || !carId) return;

    (async () => {
      try {
        const qRef = query(
          collection(db, "wishlists"),
          where("buyerId", "==", uid),
          where("carId", "==", carId)
        );
        const snap = await getDocs(qRef);
        setInList(!snap.empty);
      } catch (err) {
        console.error("Check wishlist error:", err);
      }
    })();
  }, [uid, carId]);

  const toggle = async () => {
    if (!uid) {
      alert("Sign in to use wishlist");
      return;
    }
    if (!carId) return;

    setLoading(true);
    try {
      const qRef = query(
        collection(db, "wishlists"),
        where("buyerId", "==", uid),
        where("carId", "==", carId)
      );
      const snap = await getDocs(qRef);

      if (inList) {
        // remove all matches for safety (normally there will be only one)
        await Promise.all(
          snap.docs.map((d) =>
            deleteDoc(doc(db, "wishlists", d.id))
          )
        );
        setInList(false);
      } else {
        // only add if not already there
        if (snap.empty) {
          await addDoc(collection(db, "wishlists"), {
            buyerId: uid,
            carId,
            title: title || null,
            price: price ?? null,
            image: image || null,
          });
        }
        setInList(true);
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      alert("Failed to update wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={toggle} disabled={loading}>
      {loading
        ? "Updating..."
        : inList
        ? "Remove from Wishlist"
        : "Add to Wishlist"}
    </button>
  );
}