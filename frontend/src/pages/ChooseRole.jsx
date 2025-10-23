import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ChooseRole() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("buyer");
  const [phone, setPhone] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return nav("/login");

      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists() && snap.data().role) {
        nav(snap.data().role === "seller" ? "/seller" : "/buyer");
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [nav]);

  const save = async () => {
    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    await updateDoc(doc(db, "users", auth.currentUser.uid), { role, phone });
    nav(role === "seller" ? "/seller" : "/buyer");
  };

  if (loading) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <h2>Select your role</h2>

      <div className="formRow" style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "500px" }}>
        <select
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>

        <input
          className="input"
          type="text"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button className="button" onClick={save}>Continue</button>
      </div>
    </div>
  );
}