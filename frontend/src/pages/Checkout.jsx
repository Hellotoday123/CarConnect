// src/pages/Checkout.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import "../style.css";

export default function Checkout() {
  const { carId } = useParams();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ---------- Load car ----------
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "cars", carId));
        if (snap.exists()) {
          setCar({ id: snap.id, ...snap.data() });
        } else {
          setError("Car not found.");
        }
      } catch (err) {
        console.error("Load car error:", err);
        setError("Failed to load car.");
      } finally {
        setLoading(false);
      }
    })();
  }, [carId]);

  const fmtMoney = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : n;

  const numericPrice =
    typeof car?.price === "number"
      ? car.price
      : car?.price != null
      ? Number(car.price) || 0
      : 0;

  // ---------- Input formatters ----------

  const handleCardNumber = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    val = val.substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiry = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    val = val.substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + "/" + val.substring(2);
    }
    setExpiry(val);
  };

  const handleCvv = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    setCvv(val.substring(0, 4));
  };

  // Read stock from ANY of the possible fields
  const getNumericStock = (obj) => {
    if (!obj) return 0;
    let raw =
      obj.stockQTY ??
      obj.stockQty ??
      obj.stock ??
      0;

    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      const n = Number(raw);
      return Number.isNaN(n) ? 0 : n;
    }
    return 0;
  };

  // ---------- Submit handler ----------
  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in as a buyer to purchase.");
      return;
    }

    if (!car) {
      setError("Car not loaded.");
      return;
    }

    if (
      !nameOnCard.trim() ||
      !cardNumber.trim() ||
      !expiry.trim() ||
      !cvv.trim()
    ) {
      setError("Please fill in all payment fields.");
      return;
    }

    try {
      setSaving(true);

      // 1) Get latest car data
      const carRef = doc(db, "cars", car.id);
      const latestSnap = await getDoc(carRef);
      if (!latestSnap.exists()) {
        setError("This car is no longer available.");
        setSaving(false);
        return;
      }

      const latest = { id: latestSnap.id, ...latestSnap.data() };

      const currentQty = getNumericStock(latest);
      console.log("Current stock:", currentQty);

      if (currentQty <= 0) {
        setError("This car is out of stock.");
        setSaving(false);
        return;
      }

      const newQty = currentQty - 1;
      console.log("New stock:", newQty);

      // 2) Decrease stock in Firestore
      //    Update all common stock fields to keep everything in sync
      await updateDoc(carRef, {
        stockQTY: newQty,
        stockQty: newQty,
        stock: newQty,
        sold: newQty <= 0 ? true : latest.sold ?? false,
        active: newQty <= 0 ? false : latest.active ?? true,
      });

      // 3) Compute last 4 digits from formatted card number
      const cleanCard = cardNumber.replace(/\D/g, "");
      const last4 = cleanCard.slice(-4);

      // 4) Create the order / receipt
      const orderRef = await addDoc(collection(db, "orders"), {
        buyerId: user.uid,
        buyerEmail: user.email || null,
        sellerId: latest.sellerId || null,
        carId: carRef.id,
        carName:
          latest.name ||
          [latest.year, latest.make, latest.model]
            .filter(Boolean)
            .join(" "),
        price: numericPrice,
        createdAt: serverTimestamp(),
        paymentStatus: "paid",
        cardLast4: last4 || null,
      });

      // 5) Update local UI
      setCar((prev) =>
        prev
          ? {
              ...prev,
              stockQTY: newQty,
              stockQty: newQty,
              stock: newQty,
              sold: newQty <= 0,
              active: newQty > 0,
            }
          : prev
      );

      setSuccessMsg(
        `Purchase accepted! Your receipt number is ${orderRef.id}.`
      );
    } catch (err) {
      console.error("Checkout error:", err);
      const msg =
        err?.message?.includes("Missing or insufficient permissions")
          ? "Missing or insufficient permissions – double-check your Firestore rules for /cars and /orders."
          : err?.message || "Purchase failed. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="page-wrap">
        <p className="page-status">Loading checkout…</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="page-wrap">
        <p className="page-status error">{error || "Car not found."}</p>
      </div>
    );
  }

  const title =
    car.name ||
    [car.year, car.make, car.model].filter(Boolean).join(" ") ||
    "Car";

  const displayStock = getNumericStock(car);

  return (
    <div className="page-wrap">
      <div className="card">
        <h1 className="page-title">Payment Details</h1>

        {/* Summary section */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ color: "#9ca3af", fontSize: 14 }}>
            Total:{" "}
            <span style={{ color: "#fff" }}>
              {numericPrice > 0 ? fmtMoney(numericPrice) : "Price on request"}
            </span>
          </div>
          <div style={{ color: "#9ca3af", fontSize: 14 }}>
            Stock: <span style={{ color: "#fff" }}>{displayStock}</span>
          </div>
        </div>

        {error && (
          <p className="form-error" style={{ marginBottom: 8 }}>
            {error}
          </p>
        )}
        {successMsg && (
          <p className="form-success" style={{ marginBottom: 8 }}>
            {successMsg}
          </p>
        )}

        <form className="checkout-form" onSubmit={handlePay}>
          <label>
            Name on card
            <input
              type="text"
              value={nameOnCard}
              onChange={(e) => setNameOnCard(e.target.value)}
            />
          </label>

          <label>
            Card number
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumber}
              maxLength={19}
              placeholder="1234 5678 9012 3456"
            />
          </label>

          <label>
            Expiry (MM/YY)
            <input
              type="text"
              value={expiry}
              onChange={handleExpiry}
              maxLength={5}
              placeholder="MM/YY"
            />
          </label>

          <label>
            CVV
            <input
              type="password"
              value={cvv}
              onChange={handleCvv}
              maxLength={4}
              placeholder="***"
            />
          </label>

          <button
            type="submit"
            className="primary-btn"
            disabled={saving}
          >
            {saving
              ? "Processing…"
              : `Pay ${
                  numericPrice > 0 ? fmtMoney(numericPrice) : "$0"
                }`}
          </button>
        </form>
      </div>
    </div>
  );
}
