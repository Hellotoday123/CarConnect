const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

// Add a car (seller)
router.post("/", async (req, res) => {
  try {
    const { name, make, year, price, mileage, sellerId, contact } = req.body;
    if (!name || !make || !year || !price || !sellerId) {
      return res.status(400).json({ error: "name, make, year, price, sellerId are required" });
    }
    const doc = {
      name, make, year: Number(year), price: Number(price),
      mileage: mileage ? Number(mileage) : 0,
      sellerId,
      contact: contact || {},
      createdAt: new Date()
    };
    const ref = await db.collection("cars").add(doc);
    res.json({ ok: true, id: ref.id, car: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get cars with optional filters ?make=Audi&minPrice=10000&maxPrice=50000&minYear=2015
router.get("/", async (req, res) => {
  try {
    let q = db.collection("cars");
    const { make, minPrice, maxPrice, minYear, maxYear } = req.query;
    if (make) q = q.where("make", "==", make);
    if (minPrice) q = q.where("price", ">=", Number(minPrice));
    if (maxPrice) q = q.where("price", "<=", Number(maxPrice));
    if (minYear) q = q.where("year", ">=", Number(minYear));
    if (maxYear) q = q.where("year", "<=", Number(maxYear));
    const snap = await q.orderBy("price").limit(50).get(); // remove orderBy if it conflicts with filters for now
    const cars = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(cars);
  } catch (e) {
    // If composite index is needed, Firestore will complain. Just remove orderBy or create the index it suggests.
    res.status(500).json({ error: e.message });
  }
});

// Get single car
router.get("/:id", async (req, res) => {
  try {
    const doc = await db.collection("cars").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;