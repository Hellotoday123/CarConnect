import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { collection, getDocs, query, where, updateDoc, doc, orderBy } from "firebase/firestore";

export default function MyTestDrives() {
  const [reqs, setReqs] = useState([]);
  const uid = auth.currentUser?.uid;

  const load = async () => {
    if (!uid) return;
    const q = query(
      collection(db, "test_drive_requests"),
      where("buyerId", "==", uid),
      orderBy("requestedAt", "desc")
    );
    const snap = await getDocs(q);
    setReqs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { load(); }, [uid]);

  const cancel = async (r) => {
    if (!["pending", "approved"].includes(r.status)) return alert("Cannot cancel now");
    await updateDoc(doc(db, "test_drive_requests", r.id), { status: "cancelled_by_buyer" });
    await load();
  };

  return (
    <div>
      <h1>My Test Drives</h1>
      {reqs.map(r => (
        <div key={r.id} style={{border:"1px solid #ddd", padding:12, marginBottom:8}}>
          <div>Car: {r.carId}</div>
          <div>Status: {r.status}</div>
          <div>Time: {r.slotStart?.toDate?.().toLocaleString?.() || ""}</div>
          {["pending","approved"].includes(r.status) && (
            <button onClick={()=>cancel(r)}>Cancel</button>
          )}
        </div>
      ))}
    </div>
  );
}