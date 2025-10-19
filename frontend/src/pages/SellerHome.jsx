import { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';


export default function SellerHome(){
const [cars, setCars] = useState([]);


const load = async () => {
const qRef = query(collection(db, 'cars'), where('sellerId', '==', auth.currentUser.uid));
const snap = await getDocs(qRef);
setCars(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};


useEffect(() => { load(); }, []);


const remove = async (id) => {
await deleteDoc(doc(db, 'cars', id));
await load();
};


return (
<div className="container">
<div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
<h2>Your Inventory</h2>
<Link className="button" to="/seller/cars">Add Vehicle</Link>
</div>
<div className="grid">
{cars.map(c => (
<div key={c.id} className="card">
<img src={c.images?.[0]} alt={c.name} style={{width:'100%', borderRadius:10}} />
<h3>{c.name}</h3>
<p>{c.make} • {c.year} • ${c.price}</p>
<div className="formRow">
<Link className="button" to={`/seller/cars/${c.id}`}>Edit</Link>
<button className="button" onClick={()=>remove(c.id)}>Remove</button>
</div>
</div>
))}
</div>
</div>
);
}