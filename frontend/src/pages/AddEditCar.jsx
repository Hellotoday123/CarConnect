import { useEffect, useState } from 'react';
imageUrl = await getDownloadURL(storageRef);
}


if (editing) {
await updateDoc(doc(db, 'cars', id), {
name: form.name,
make: form.make,
year: Number(form.year),
price: Number(form.price),
contact: { email: form.contactEmail, phone: form.contactPhone },
active: form.active
});
} else {
await addDoc(collection(db, 'cars'), {
name: form.name,
make: form.make,
year: Number(form.year),
price: Number(form.price),
sellerId: auth.currentUser.uid,
contact: { email: form.contactEmail, phone: form.contactPhone },
images: imageUrl ? [imageUrl] : [],
createdAt: serverTimestamp(),
active: true
});
}


nav('/seller');
};


return (
<div className="container">
<h2>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
<form onSubmit={submit}>
<div className="formRow">
<input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
<input className="input" placeholder="Make" value={form.make} onChange={e=>setForm({...form,make:e.target.value})} />
</div>
<div className="formRow">
<input className="input" placeholder="Year" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} />
<input className="input" placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} />
</div>
<div className="formRow">
<input className="input" placeholder="Contact Email" value={form.contactEmail} onChange={e=>setForm({...form,contactEmail:e.target.value})} />
<input className="input" placeholder="Contact Phone" value={form.contactPhone} onChange={e=>setForm({...form,contactPhone:e.target.value})} />
</div>
<div className="formRow">
<input className="input" type="file" onChange={e=>setFile(e.target.files[0])} />
<label style={{display:'flex', alignItems:'center', gap:8}}>
<input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})} /> Active
</label>
</div>
<button className="button">Save</button>
</form>
</div>
);
}