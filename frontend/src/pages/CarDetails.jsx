import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';


export default function CarDetails(){
const { id } = useParams();
const [car, setCar] = useState(null);


useEffect(() => {
(async () => {
const snap = await getDoc(doc(db, 'cars', id));
setCar({ id: snap.id, ...snap.data() });
})();
}, [id]);


if (!car) return <div className="container">Loading...</div>;


return (
<div className="container">
<img src={car.images?.[0]} alt={car.name} style={{maxWidth:600, width:'100%', borderRadius:12}} />
<h2>{car.name}</h2>
<p>Make: {car.make} • Year: {car.year} • Price: ${car.price}</p>
<h3>Dealership Contact</h3>
<p>Email: {car.contact?.email} • Phone: {car.contact?.phone}</p>
<p>Car info coming soon…</p>
</div>
);
}