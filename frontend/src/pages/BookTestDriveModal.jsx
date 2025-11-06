import { useState } from "react";
import { auth, db } from "../services/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function BookTestDriveModal({ car, onClose }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const submit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { alert("Sign in to book"); return; }
    if (!date || !time) { alert("Choose date & time"); return; }
    const slot = new Date(`${date}T${time}:00`);
    await addDoc(collection(db, "test_drive_requests"), {
      carId: car.id,
      buyerId: uid,
      sellerId: car.sellerId,
      requestedAt: serverTimestamp(),
      slotStart: slot,
      status: "pending",
    });
    alert("Request sent");
    onClose?.();
  };

  return (
    <div>
      <h3>Book test drive for {car.model}</h3>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
      <button onClick={submit}>Send request</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
}