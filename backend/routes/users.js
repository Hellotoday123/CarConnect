const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

// Create/Update profile: body = { uid, role, displayName, email, phone }
router.post("/", async (req, res) => {
  try {
    const { uid, role, displayName, email, phone } = req.body;
    if (!uid || !role) return res.status(400).json({ error: "uid and role are required" });

    const doc = { uid, role, displayName: displayName || "", email: email || "", phone: phone || "" };
    await db.collection("users").doc(uid).set(doc, { merge: true });
    res.json({ ok: true, user: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get a user by uid
router.get("/:uid", async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.params.uid).get();
    if (!snap.exists) return res.status(404).json({ error: "not found" });
    res.json(snap.data());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;