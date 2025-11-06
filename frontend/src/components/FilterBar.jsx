import { useState } from "react";

export default function FilterBar({ onChange }) {
  const [model, setModel] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [mileageMax, setMileageMax] = useState("");
  const [condition, setCondition] = useState(""); // "", "new", "used"
  const [rangeField, setRangeField] = useState("price"); // "price" | "year" | "mileage"

  const apply = () => {
    onChange({
      model: model.trim(),
      condition: condition || null,
      rangeField,
      priceMin: priceMin ? Number(priceMin) : null,
      priceMax: priceMax ? Number(priceMax) : null,
      yearMin: yearMin ? Number(yearMin) : null,
      yearMax: yearMax ? Number(yearMax) : null,
      mileageMax: mileageMax ? Number(mileageMax) : null,
    });
  };
  

  const clear = () => {
    setModel(""); setPriceMin(""); setPriceMax("");
    setYearMin(""); setYearMax(""); setMileageMax("");
    setCondition(""); setRangeField("price");
    onChange({});
  };

  return (
    <div style={{ display:"grid", gap:8, gridTemplateColumns:"repeat(6, 1fr)", alignItems:"end" }}>
      <div>
        <label>Model</label>
        <input value={model} onChange={e=>setModel(e.target.value)} placeholder="e.g. Civic" />
      </div>
      <div>
        <label>Condition</label>
        <select value={condition} onChange={e=>setCondition(e.target.value)}>
          <option value="">Any</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
      </div>
      <div>
        <label>Range Field</label>
        <select value={rangeField} onChange={e=>setRangeField(e.target.value)}>
          <option value="price">Price</option>
          <option value="year">Year</option>
          <option value="mileage">Mileage</option>
        </select>
      </div>
      <div>
        <label>Price min/max</label>
        <div><input type="number" value={priceMin} onChange={e=>setPriceMin(e.target.value)} placeholder="min" />
        <input type="number" value={priceMax} onChange={e=>setPriceMax(e.target.value)} placeholder="max" /></div>
      </div>
      <div>
        <label>Year min/max</label>
        <div><input type="number" value={yearMin} onChange={e=>setYearMin(e.target.value)} placeholder="min" />
        <input type="number" value={yearMax} onChange={e=>setYearMax(e.target.value)} placeholder="max" /></div>
      </div>
      <div>
        <label>Mileage ≤</label>
        <input type="number" value={mileageMax} onChange={e=>setMileageMax(e.target.value)} placeholder="max" />
      </div>
      <button onClick={apply}>Apply</button>
      <button onClick={clear}>Clear</button>
    </div>
  );
}