import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,        // 👈 for edits
  where,
} from "firebase/firestore";
import "../style.css";

export default function Inventory() {
  const [uid, setUid] = useState(null);

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // 👈 null = add, id = edit

  const [form, setForm] = useState({
    name: "",
    make: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    description: "",
    active: true,
  });

  // track login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
    return () => unsub();
  }, []);

  // load this seller's cars
  useEffect(() => {
    if (!uid) return;
    let cancel = false;

    (async () => {
      setLoading(true);
      try {
        const col = collection(db, "cars");
        let items = [];

        try {
          const q1 = query(col, where("sellerUid", "==", uid), orderBy("createdAt", "desc"));
          const s1 = await getDocs(q1);
          items = s1.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (e) {
          if (e?.code === "failed-precondition") {
            const q1b = query(col, where("sellerUid", "==", uid));
            const s1b = await getDocs(q1b);
            items = s1b.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            throw e;
          }
        }

        // Legacy fallback if old docs used sellerId
        if (items.length === 0) {
          try {
            const q2 = query(col, where("sellerId", "==", uid));
            const s2 = await getDocs(q2);
            const more = s2.docs.map((d) => ({ id: d.id, ...d.data() }));
            const map = new Map(items.map((x) => [x.id, x]));
            more.forEach((x) => map.set(x.id, x));
            items = Array.from(map.values());
          } catch {/* ignore */}
        }

        if (!cancel) setCars(items);
      } catch (err) {
        console.error("Load cars error:", err);
        if (!cancel) setCars([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [uid]);

  // helpers
  const resetForm = () => {
    setForm({
      name: "",
      make: "",
      model: "",
      year: "",
      price: "",
      mileage: "",
      description: "",
      active: true,
    });
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const startAdd = () => {
    setEditingId(null);
    resetForm();
    setShowForm(true);
  };

  const startEdit = (car) => {
    setEditingId(car.id);
    setForm({
      name: car.name || "",
      make: car.make || "",
      model: car.model || "",
      year: car.year ?? "",
      price: car.price ?? "",
      mileage: car.mileage ?? "",
      description: car.description || "",
      active: car.active !== false,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  // CREATE or UPDATE
  const saveCar = async (e) => {
    e.preventDefault();
    if (!uid) return alert("You must be logged in.");
    setSaving(true);

    try {
      const au = auth.currentUser;
      const email = au?.email || "";
      const authPhone = au?.phoneNumber || "";
      let profilePhone = "";
      try {
        const snap = await getDoc(doc(db, "users", uid));
        const u = snap.exists() ? snap.data() : {};
        profilePhone = u?.phone || u?.contact?.phone || "";
      } catch { /* ignore */ }

      const base = {
        ...form,
        year: form.year !== "" ? Number(form.year) : null,
        price: form.price !== "" ? Number(form.price) : null,
        mileage: form.mileage !== "" ? Number(form.mileage) : null,
        sellerUid: uid,         // matches your rules
        sellerId: uid,          // legacy safety
        contact: {
          email: email || undefined,
          phone: (authPhone || profilePhone) || undefined,
        },
      };

      if (editingId) {
        // UPDATE
        await updateDoc(doc(db, "cars", editingId), {
          ...base,
          updatedAt: serverTimestamp(),
        });
        setCars((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...base } : c)));
        alert("Car updated!");
      } else {
        // CREATE
        const ref = await addDoc(collection(db, "cars"), {
          ...base,
          createdAt: serverTimestamp(),
        });
        setCars((prev) => [{ id: ref.id, ...base }, ...prev]);
        alert("Car added!");
      }

      cancelForm();
    } catch (err) {
      console.error("saveCar error:", err);
      alert(`Failed to save car:\n${err.code || ""}\n${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const removeCar = async (id) => {
    if (!confirm("Delete this car?")) return;
    await deleteDoc(doc(db, "cars", id));
    setCars((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="inventory-wrap">
      <div className="topbar">
        <h2>Inventory</h2>
        <button className="add-btn" onClick={startAdd}>
          Add Car
        </button>
      </div>

      {showForm && (
        <form className="form" onSubmit={saveCar}>
          <label>
            Name
            <input name="name" value={form.name} onChange={onChange} />
          </label>
          <label>
            Make
            <input name="make" value={form.make} onChange={onChange} required />
          </label>
          <label>
            Model
            <input name="model" value={form.model} onChange={onChange} required />
          </label>
          <label>
            Year
            <input type="number" name="year" value={form.year} onChange={onChange} required />
          </label>
          <label>
            Price
            <input type="number" name="price" value={form.price} onChange={onChange} required />
          </label>
          <label>
            Mileage
            <input type="number" name="mileage" value={form.mileage} onChange={onChange} />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={onChange} />
          </label>
          <label className="checkbox">
            <input type="checkbox" name="active" checked={!!form.active} onChange={onChange} />
            Active
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
            </button>
            <button type="button" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="car-list">
        {loading && <p>Loading...</p>}
        {!loading && cars.length === 0 && <p>No cars in inventory.</p>}
        {cars.map((c) => (
          <div key={c.id} className="car-item">
            <div>
              <h3>{c.name || `${c.make ?? ""} ${c.model ?? ""}`.trim()}</h3>
              <p>
                {c.price ? `$${c.price}` : ""} {c.year ? `• ${c.year}` : ""}{" "}
                {c.mileage ? `• ${c.mileage} km` : ""}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="edit-btn" onClick={() => startEdit(c)}>Edit</button>
                <button className="remove-btn" onClick={() => removeCar(c.id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}