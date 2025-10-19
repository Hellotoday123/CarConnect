import { useEffect, useMemo, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';


export default function BuyerHome(){
const [qText, setQText] = useState('');
const [cars, setCars] = useState([]);


const runQuery = useMemo(() => qText.trim().toLowerCase(), [qText]);


useEffect(() => {
(async () => {
let qRef = collection(db, 'cars');
if (runQuery) {
// simple client-side filter after fetch; for large data, create a nameLower field and use where('nameLower','>=',runQuery)
}
const snap = await getDocs(qRef);
const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setCars(rows.filter(c => c.active !== false).filter(c => c.name.toLowerCase().includes(runQuery)));
})();
}, [runQuery]);


return (
<div className="container">
<div className="formRow">
<input className="input" placeholder="Search Name" value={qText} onChange={e=>setQText(e.target.value)} />
</div>
<div className="grid">
{cars.map(c => (
<div key={c.id} className="card">
<img src={c.images?.[0]} alt={c.name} style={{width:'100%', borderRadius:10}} />
<h3>{c.name}</h3>
<p>{c.make} • {c.year} • ${c.price}</p>
<Link className="button" to={`/cars/${c.id}`}>View</Link>
</div>
))}
</div>
</div>
);
}