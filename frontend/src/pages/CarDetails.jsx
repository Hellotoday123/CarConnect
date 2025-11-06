import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import "../style.css";

export default function CarDetails() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  const [wishLoading, setWishLoading] = useState(false);
  const [wishAdded, setWishAdded] = useState(false);

  // index of currently shown image
  const [currentIndex, setCurrentIndex] = useState(0);

  // load car
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "cars", id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setCar(data);
          setCurrentIndex(0); // reset to first image when car loads
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // check if this car is already in the user's wishlist
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !car) return;

    (async () => {
      try {
        const qRef = query(
          collection(db, "users", user.uid, "wishlist"),
          where("carId", "==", car.id)
        );
        const snap = await getDocs(qRef);
        if (!snap.empty) {
          setWishAdded(true); // keep the "Added to wishlist ✓" state
        } else {
          setWishAdded(false);
        }
      } catch (e) {
        console.error("Error checking wishlist:", e);
      }
    })();
  }, [car]);

  if (loading)
    return (
      <div className="details-wrap">
        <p>Loading…</p>
      </div>
    );
  if (!car)
    return (
      <div className="details-wrap">
        <p>Car not found.</p>
      </div>
    );

  const title =
    car.name ||
    [car.make, car.model].filter(Boolean).join(" ") ||
    "Vehicle";

  // all images for this car
  const images =
    (car.images && car.images.length > 0
      ? car.images
      : car.imageUrl
      ? [car.imageUrl]
      : []) || [];

  const fallbackImg =
    "https://via.placeholder.com/1200x800?text=No+Image";

  const img =
    images.length > 0
      ? images[currentIndex % images.length]
      : fallbackImg;

  const fmtMoney = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : n;

  const handleAddToWishlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in to add cars to your wishlist.");
      return;
    }

    setWishLoading(true);
    try {
      // check again to avoid duplicates
      const qRef = query(
        collection(db, "users", user.uid, "wishlist"),
        where("carId", "==", car.id)
      );
      const existing = await getDocs(qRef);
      if (!existing.empty) {
        setWishAdded(true);
        return;
      }

      await addDoc(collection(db, "users", user.uid, "wishlist"), {
        carId: car.id,
        title,
        price: car.price ?? null,
        image: img,
        createdAt: serverTimestamp(),
      });
      setWishAdded(true);
    } catch (e) {
      console.error("Add to wishlist error:", e);
      alert("Failed to add to wishlist. Please try again.");
    } finally {
      setWishLoading(false);
    }
  };

  const nextImage = () => {
    if (images.length < 2) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length < 2) return;
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <div className="details-wrap">
      <div className="details-grid">
        {/* LEFT: image + contact */}
        <div className="details-media">
          <div className="details-photo">
            <img src={img} alt={title} />

            {/* arrows only if there is more than one image */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="carousel-arrow left"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  ❮
                </button>
                <button
                  type="button"
                  className="carousel-arrow right"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  ❯
                </button>
              </>
            )}
          </div>

          <div className="details-contact">
            <div className="details-contact-title">Contact</div>
            <div className="details-contact-line">
              {car.contact?.email ? (
                <a
                  href={`mailto:${car.contact.email}`}
                  className="details-link"
                >
                  {car.contact.email}
                </a>
              ) : (
                <span className="muted">Email unavailable</span>
              )}
            </div>
            <div className="details-contact-line">
              {car.contact?.phone ? (
                <a
                  href={`tel:${car.contact.phone}`}
                  className="details-link"
                >
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >
            <h1
              className="details-title"
              style={{ marginRight: "auto" }}
            >
              {title}
            </h1>

            {/* Add to wishlist button */}
            <button
              type="button"
              className="button"
              onClick={handleAddToWishlist}
              disabled={wishLoading || wishAdded}
              style={{ width: "auto", whiteSpace: "nowrap" }}
            >
              {wishLoading
                ? "Adding..."
                : wishAdded
                ? "Added to wishlist ✓"
                : "Add to wishlist"}
            </button>
          </div>

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
                <strong>
                  {Number(car.mileage).toLocaleString()} km
                </strong>
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
