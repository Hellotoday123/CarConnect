// src/components/CarCard.jsx
import { Link } from "react-router-dom";

export default function CarCard({ car }) {
  return (
    <div className="card">
      <img
        src={car.images?.[0] || car.imageUrl}
        alt={car.name || `${car.make ?? ""} ${car.model ?? ""}`}
        style={{ width: "100%", borderRadius: 10 }}
      />

      <h3>{car.name || `${car.year ?? ""} ${car.make ?? ""} ${car.model ?? ""}`}</h3>

      <p>
        {[car.make, car.model, car.year].filter(Boolean).join(" • ")}
        {car.price ? ` • $${car.price}` : ""}
      </p>

      <Link className="button" to={`/cars/${car.id}`}>
        View
      </Link>
    </div>
  );
}