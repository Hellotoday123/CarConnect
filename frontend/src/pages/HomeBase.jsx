// src/pages/HomeBase.jsx
import { useEffect, useMemo, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";

const PAGE_SIZE = 9;

export default function HomeBase() {
  const [qText, setQText] = useState("");
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    condition: "",
    rangeField: "",          // "" = default (sort by name)
    priceMin: "",
    priceMax: "",
    yearMin: "",
    yearMax: "",
    mileageMax: "",
    sortDir: "asc",
    activeOnly: true,
  });

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  // fetch all cars (activeOnly toggle)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const carsRef = collection(db, "cars");
        const qRef = filters.activeOnly
          ? query(carsRef, where("active", "==", true))
          : carsRef;
        const snap = await getDocs(qRef);
        if (cancel) return;
        setCars(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        if (!cancel) setErr(e.message || "Failed to load listings.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [filters.activeOnly]);

  // reset to first page whenever filters or quick search change
  useEffect(() => {
    setPageIndex(0);
  }, [filters, qText]);

  const filteredCars = useMemo(() => {
    const toNum = (value) => {
      if (value === null || value === undefined) return NaN;
      const cleaned = String(value).replace(/[^\d.]/g, "");
      return cleaned ? Number(cleaned) : NaN;
    };

    let list = [...cars];

    // condition
    if (filters.condition) {
      list = list.filter(
        (c) =>
          (c.condition || "").toLowerCase() ===
          filters.condition.toLowerCase()
      );
    }

    // make filter ("contains")
    const makeSearch = filters.make.trim().toLowerCase();
    if (makeSearch) {
      list = list.filter((c) =>
        (c.make || "").toString().toLowerCase().includes(makeSearch)
      );
    }

    // model filter ("contains" anywhere — changed from startsWith)
    const modelSearch = filters.model.trim().toLowerCase();
    if (modelSearch) {
      list = list.filter((c) => {
        const base =
          (c.modelLower ||
            c.model ||
            `${c.make || ""} ${c.model || ""}`) + "";
        return base.toLowerCase().includes(modelSearch);
      });
    }

    // numeric filters
    list = list.filter((c) => {
      const price = toNum(c.price);
      const year = toNum(c.year);
      const mileage = toNum(c.mileage);

      if (filters.priceMin && !Number.isNaN(price) && price < Number(filters.priceMin)) return false;
      if (filters.priceMax && !Number.isNaN(price) && price > Number(filters.priceMax)) return false;
      if (filters.yearMin && !Number.isNaN(year) && year < Number(filters.yearMin)) return false;
      if (filters.yearMax && !Number.isNaN(year) && year > Number(filters.yearMax)) return false;
      if (filters.mileageMax && !Number.isNaN(mileage) && mileage > Number(filters.mileageMax)) return false;

      return true;
    });

    // quick text search
    const t = qText.trim().toLowerCase();
    if (t) {
      list = list.filter((c) =>
        [
          c.name,
          c.make,
          c.model,
          c.trim,
          c.year,
          c.dealershipName,
          c.city,
          c.condition,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(t)
      );
    }

    // sorting
    const sortDir = filters.sortDir;
    const field = filters.rangeField;

    if (!field) {
      // default alphabetical sort by name / make+model
      list.sort((a, b) => {
        const va = (a.name || `${a.make || ""} ${a.model || ""}`).toLowerCase();
        const vb = (b.name || `${b.make || ""} ${b.model || ""}`).toLowerCase();
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // numeric sort
      list.sort((a, b) => {
        const va = toNum(a[field]);
        const vb = toNum(b[field]);
        if (Number.isNaN(va) && Number.isNaN(vb)) return 0;
        if (Number.isNaN(va)) return 1;
        if (Number.isNaN(vb)) return -1;
        return sortDir === "desc" ? vb - va : va - vb;
      });
    }

    return list;
  }, [cars, filters, qText]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE));
  const visibleCars = filteredCars.slice(
    pageIndex * PAGE_SIZE,
    pageIndex * PAGE_SIZE + PAGE_SIZE
  );

  const clearFilters = () =>
    setFilters({
      make: "",
      model: "",
      condition: "",
      rangeField: "",
      priceMin: "",
      priceMax: "",
      yearMin: "",
      yearMax: "",
      mileageMax: "",
      sortDir: "asc",
      activeOnly: true,
    });

  return (
    <div className="container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Browse Cars</h2>
        <input
          className="input"
          style={{ maxWidth: 260 }}
          placeholder="Quick search (make / model / city)…"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Make</label>
            <input
              className="input"
              placeholder="Make"
              value={filters.make}
              onChange={(e) =>
                setFilters({ ...filters, make: e.target.value })
              }
            />
          </div>

          <div className="filter-group">
            <label>Model</label>
            <input
              className="input"
              placeholder="Model"
              value={filters.model}
              onChange={(e) =>
                setFilters({ ...filters, model: e.target.value })
              }
            />
          </div>

          <div className="filter-group">
            <label>Condition</label>
            <select
              className="select"
              value={filters.condition}
              onChange={(e) =>
                setFilters({ ...filters, condition: e.target.value })
              }
            >
              <option value="">Any</option>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              className="select"
              value={filters.rangeField}
              onChange={(e) =>
                setFilters({ ...filters, rangeField: e.target.value })
              }
            >
              <option value="">Name (Default)</option>
              <option value="price">Price</option>
              <option value="year">Year</option>
              <option value="mileage">Mileage</option>
            </select>
          </div>

          <div className="filter-group" style={{ maxWidth: 150 }}>
            <label>Order</label>
            <select
              className="select"
              value={filters.sortDir}
              onChange={(e) =>
                setFilters({ ...filters, sortDir: e.target.value })
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Price min/max</label>
            <div className="minmax-row">
              <input
                className="input"
                type="number"
                placeholder="min"
                value={filters.priceMin}
                onChange={(e) =>
                  setFilters({ ...filters, priceMin: e.target.value })
                }
              />
              <input
                className="input"
                type="number"
                placeholder="max"
                value={filters.priceMax}
                onChange={(e) =>
                  setFilters({ ...filters, priceMax: e.target.value })
                }
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Year min/max</label>
            <div className="minmax-row">
              <input
                className="input"
                type="number"
                placeholder="min"
                value={filters.yearMin}
                onChange={(e) =>
                  setFilters({ ...filters, yearMin: e.target.value })
                }
              />
              <input
                className="input"
                type="number"
                placeholder="max"
                value={filters.yearMax}
                onChange={(e) =>
                  setFilters({ ...filters, yearMax: e.target.value })
                }
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Mileage ≤</label>
            <input
              className="input"
              type="number"
              placeholder="max"
              value={filters.mileageMax}
              onChange={(e) =>
                setFilters({ ...filters, mileageMax: e.target.value })
              }
            />
          </div>
        </div>

        {/* only Clear button remains */}
        <div className="filter-actions" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="button ghost"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Status */}
      {loading && <p style={{ padding: 24 }}>Loading listings…</p>}
      {err && <p style={{ padding: 24, color: "salmon" }}>⚠ {err}</p>}
      {!loading && !err && visibleCars.length === 0 && (
        <p style={{ padding: 24 }}>No cars match your filters.</p>
      )}

      {/* Cars grid */}
      <div className="grid">
        {visibleCars.map((c) => (
          <div key={c.id} className="card">
            <img
              src={c.images?.[0] || c.imageUrl}
              alt={c.name || `${c.make || ""} ${c.model || ""}`}
              style={{ width: "100%", borderRadius: 10 }}
            />
            <h3>{c.name || `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`}</h3>
            <p>
              {[c.make, c.model, c.year].filter(Boolean).join(" • ")}
              {c.price ? ` • $${c.price}` : ""}
            </p>
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              {c.city || c.dealershipName || ""}
              {c.mileage ? ` • ${c.mileage} km` : ""}
              {c.condition ? ` • ${c.condition}` : ""}
            </p>
            <Link className="button" to={`/cars/${c.id}`}>
              View
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          className="button"
          style={{ width: 90, opacity: pageIndex === 0 ? 0.6 : 1 }}
          onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          disabled={pageIndex === 0}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 13, opacity: 0.8 }}>
          Page {pageIndex + 1} of {pageCount}
        </span>
        <button
          className="button"
          style={{
            width: 90,
            opacity: pageIndex >= pageCount - 1 ? 0.6 : 1,
          }}
          onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
          disabled={pageIndex >= pageCount - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
