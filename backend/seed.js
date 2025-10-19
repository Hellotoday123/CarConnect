const { db } = require("./firebase");

async function run() {
  const uid = "seller_demo_uid_1";
  await db.collection("users").doc(uid).set({
    uid,
    role: "seller",
    displayName: "John Doe",
    email: "john@example.com",
    phone: "+1-555-1111"
  });

  await db.collection("cars").add({
    name: "Audi R8 V10",
    make: "Audi",
    year: 2020,
    price: 150000,
    mileage: 12000,
    sellerId: uid,
    contact: { email: "dealer@example.com", phone: "+1-555-2222" },
    createdAt: new Date()
  });

  console.log("Seed complete");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });