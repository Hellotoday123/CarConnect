import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { collection, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

export default function WishlistButton({ carId }) {
  const [inList, setInList] = useState(false);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const ref = doc(db, "users", uid, "wishlist", carId);
      const snap = await getDoc(ref);
      setInList(snap.exists());
    })();
  }, [uid, carId]);

  const toggle = async () => {
    if (!uid) { alert("Sign in to use wishlist"); return; }
    const ref = doc(db, "users", uid, "wishlist", carId);
    if (inList) {
      await deleteDoc(ref);
      setInList(false);
    } else {
      await setDoc(ref, { carId, addedAt: new Date() });
      setInList(true);
    }
  };

  return <button onClick={toggle}>{inList ? "Remove from Wishlist" : "Add to Wishlist"}</button>;
}