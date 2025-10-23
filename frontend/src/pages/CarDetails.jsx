import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import "../style.css";

export default function CarDetails() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "cars", id));
        if (snap.exists()) setCar({ id: snap.id, ...snap.data() });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="details-wrap"><p>Loading…</p></div>;
  if (!car) return <div className="details-wrap"><p>Car not found.</p></div>;

  const title =
    car.name ||
    [car.make, car.model].filter(Boolean).join(" ") ||
    "Vehicle";

  const img =
    car.images?.[0] ||
    car.imageUrl ||
    "https://via.placeholder.com/1200x800?text=No+Image";

  const fmtMoney = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : n;

  return (
    <div className="details-wrap">
      <div className="details-grid">
        {/* LEFT: image + contact */}
        <div className="details-media">
          <div className="details-photo">
            <img src={img} alt={title} />
          </div>

          <div className="details-contact">
            <div className="details-contact-title">Contact</div>
            <div className="details-contact-line">
              {car.contact?.email ? (
                <a href={`mailto:${car.contact.email}`} className="details-link">
                  {car.contact.email}
                </a>
              ) : (
                <span className="muted">Email unavailable</span>
              )}
            </div>
            <div className="details-contact-line">
              {car.contact?.phone ? (
                <a href={`tel:${car.contact.phone}`} className="details-link">
                  {car.contact.phone}
                </a>
              ) : (
                <span className="muted">Phone unavailable</span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: title, price, specs, description */}
        <div className="details-info">
          <h1 className="details-title">{title}</h1>

          <div className="details-price">
            {car.price ? fmtMoney(car.price) : "Price on request"}
          </div>

          <ul className="details-specs">
            {car.make && (
              <li>
                <span>Make</span>
                <strong>{car.make}</strong>
              </li>
            )}
            {car.model && (
              <li>
                <span>Model</span>
                <strong>{car.model}</strong>
              </li>
            )}
            {car.year && (
              <li>
                <span>Year</span>
                <strong>{car.year}</strong>
              </li>
            )}
            {car.mileage !== undefined && car.mileage !== null && (
              <li>
                <span>Mileage</span>
                <strong>{Number(car.mileage).toLocaleString()} km</strong>
              </li>
            )}
            {car.active !== undefined && (
              <li>
                <span>Status</span>
                <strong className={car.active ? "ok" : "muted"}>
                  {car.active ? "Available" : "Unavailable"}
                </strong>
              </li>
            )}
          </ul>

          <div className="details-desc">
            {car.description?.trim()
              ? car.description
              : "Car info coming soon..."}
          </div>
        </div>
      </div>
    </div>
  );
}