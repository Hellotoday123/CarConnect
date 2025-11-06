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
  updateDoc,
  where,
} from "firebase/firestore";
import "../style.css";

export default function Inventory() {
  const [uid, setUid] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // new images selected in the form (as base64 strings)
  const [newImages, setNewImages] = useState([]);

  const [form, setForm] = useState({
    name: "",
    make: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    description: "",
    condition: "",
    active: true,
    images: [], // existing images from DB
  });

  // track login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
    return () => unsub();
  }, []);

  // load seller's cars
  useEffect(() => {
    if (!uid) return;
    let cancel = false;

    (async () => {
      setLoading(true);
      try {
        const col = collection(db, "cars");
        let items = [];

        // try sellerUid + createdAt
        try {
          const q1 = query(
            col,
            where("sellerUid", "==", uid),
            orderBy("createdAt", "desc")
          );
          const s1 = await getDocs(q1);
          items = s1.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (e) {
          if (e?.code === "failed-precondition") {
            // fallback without orderBy if index missing
            const q1b = query(col, where("sellerUid", "==", uid));
            const s1b = await getDocs(q1b);
            items = s1b.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            throw e;
          }
        }

        // older docs might use sellerId instead of sellerUid
        if (items.length === 0) {
          const q2 = query(col, where("sellerId", "==", uid));
          const s2 = await getDocs(q2);
          const more = s2.docs.map((d) => ({ id: d.id, ...d.data() }));
          const map = new Map(items.map((x) => [x.id, x]));
          more.forEach((x) => map.set(x.id, x));
          items = Array.from(map.values());
        }

        if (!cancel) setCars(items);
      } catch (err) {
        console.error("Load cars error:", err);
        if (!cancel) setCars([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [uid]);

  // reset form
  const resetForm = () => {
    setForm({
      name: "",
      make: "",
      model: "",
      year: "",
      price: "",
      mileage: "",
      description: "",
      condition: "",
      active: true,
      images: [],
    });
    setNewImages([]);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "condition") {
      setForm((f) => ({
        ...f,
        condition: value,
        mileage: value === "new" ? 0 : f.mileage,
      }));
    } else {
      setForm((f) => ({
        ...f,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // convert selected files to base64 strings and APPEND to newImages
  const onMediaChange = async (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (!imageFiles.length) {
      return;
    }

    try {
      const promises = imageFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); // base64 string
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      );

      const base64Images = await Promise.all(promises);
      // append to existing newImages (so they can reopen picker and add more)
      setNewImages((prev) => [...prev, ...base64Images]);
    } catch (err) {
      console.error("File read error:", err);
      alert("Failed to read image files.");
    } finally {
      // allow choosing the same file again if needed
      e.target.value = "";
    }
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
      // support old typo "milleage" as fallback
      mileage: (car.mileage ?? car.milleage) ?? "",
      description: car.description || "",
      condition: car.condition || "",
      active: car.active !== false,
      images: car.images || [],
    });
    setNewImages([]); // new images for this edit session start empty
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  // remove one image from either existing or new ones, based on index
  const handleRemoveImage = (index) => {
    const existingCount = (form.images || []).length;

    if (index < existingCount) {
      // removing from existing images (in form.images)
      setForm((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      // removing from newImages
      const newIndex = index - existingCount;
      setNewImages((prev) => prev.filter((_, i) => i !== newIndex));
    }
  };

  // CREATE or UPDATE (no Storage, images are base64 in Firestore)
  const saveCar = async (e) => {
    e.preventDefault();
    if (!uid) {
      alert("You must be logged in.");
      return;
    }

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
      } catch (err) {
        console.error("load profile error:", err);
      }

      // final array: existing images (minus deleted ones) + all newImages
      const imagesToSave = [...(form.images || []), ...newImages];

      const base = {
        ...form,
        year: form.year !== "" ? Number(form.year) : null,
        price: form.price !== "" ? Number(form.price) : null,
        mileage:
          form.condition === "new"
            ? 0
            : form.mileage !== "" ? Number(form.mileage) : null,
        condition: form.condition || "",
        images: imagesToSave,
        sellerUid: uid,
        sellerId: uid,
        contact: {
          email: email || undefined,
          phone: (authPhone || profilePhone) || undefined,
        },
      };

      if (editingId) {
        await updateDoc(doc(db, "cars", editingId), {
          ...base,
          updatedAt: serverTimestamp(),
        });

        setCars((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...base } : c))
        );
        alert("Car updated!");
      } else {
        const refDoc = await addDoc(collection(db, "cars"), {
          ...base,
          createdAt: serverTimestamp(),
        });

        const newCar = {
          id: refDoc.id,
          ...base,
        };

        setCars((prev) => [newCar, ...prev]);
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

  // preview shows existing images first, then new ones
  const previewImages = [...(form.images || []), ...newImages];

  return (
  <div className="inventory-wrap">
    <div className="inventory-topbar">
      <h2 className="inventory-title">Inventory</h2>
      <button className="inventory-add-btn" onClick={startAdd}>
        Add Car
      </button>
    </div>

    {showForm && (
      <form className="inventory-form" onSubmit={saveCar}>
        <label>
          Name
          <input name="name" value={form.name} onChange={onChange} />
        </label>
        <label>
          Make
          <input
            name="make"
            value={form.make}
            onChange={onChange}
            required
          />
        </label>
        <label>
          Model
          <input
            name="model"
            value={form.model}
            onChange={onChange}
            required
          />
        </label>
        <label>
          Year
          <input
            type="number"
            name="year"
            value={form.year}
            onChange={onChange}
            required
          />
        </label>
        <label>
          Price
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Condition
          <select
            name="condition"
            value={form.condition}
            onChange={onChange}
            required
          >
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </label>

        <label>
          Mileage
          <input
            type="number"
            name="mileage"
            value={form.mileage}
            onChange={onChange}
            disabled={form.condition === "new"}
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            name="active"
            checked={!!form.active}
            onChange={onChange}
          />
          Active
        </label>

        <label>
          Photos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onMediaChange}
          />
          <span className="hint">
            (For this demo, photos are stored directly in Firestore. Use small
            images.)
          </span>
        </label>

        {previewImages.length > 0 && (
          <div className="image-preview-wrap">
            {previewImages.map((src, idx) => (
              <div key={idx} className="image-thumb">
                <img src={src} alt={`Preview ${idx}`} />
                <button
                  type="button"
                  className="image-remove-btn"
                  onClick={() => handleRemoveImage(idx)}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="inventory-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
          </button>
          <button type="button" onClick={cancelForm} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    )}

    {loading && <p style={{ marginTop: 24 }}>Loading...</p>}
    {!loading && cars.length === 0 && (
      <p style={{ marginTop: 24 }}>No cars in inventory.</p>
    )}

    {!loading && cars.length > 0 && (
      <div className="inventory-grid">
        {cars.map((c) => {
          const firstImage = c.images?.[0] || null;
          const title =
            c.name ||
            `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim();

          const line1Parts = [
            c.make,
            c.model,
            c.year ? String(c.year) : null,
            c.price ? `$${c.price}` : null,
          ].filter(Boolean);

          const line2Parts = [
            c.condition
              ? c.condition === "new"
                ? "• new"
                : "• used"
              : null,
            (c.mileage ?? c.milleage)
              ? `• ${(c.mileage ?? c.milleage)} km`
              : null,
          ].filter(Boolean);

          return (
            <div key={c.id} className="inventory-card">
              <div className="inventory-card-media">
                {firstImage ? (
                  <img src={firstImage} alt={title} />
                ) : (
                  <div className="inventory-card-media-placeholder">
                    No photo
                  </div>
                )}
              </div>

              <div className="inventory-card-body">
                <h3 className="inventory-card-title">{title}</h3>

                <p className="inventory-card-meta">
                  {line1Parts.join(" • ")}
                </p>

                {line2Parts.length > 0 && (
                  <p className="inventory-card-meta">
                    {line2Parts.join(" ")}
                  </p>
                )}

                {c.images?.length > 0 && (
                  <p className="inventory-card-photos">
                    {c.images.length} photo(s)
                  </p>
                )}

                <div className="inventory-card-actions">
                  <button
                    type="button"
                    className="inventory-edit-btn"
                    onClick={() => startEdit(c)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inventory-remove-btn"
                    onClick={() => removeCar(c.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

}
