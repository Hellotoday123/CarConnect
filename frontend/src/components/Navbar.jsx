import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';


export default function Navbar() {
const [role, setRole] = useState(null);
const navigate = useNavigate();


useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
if (!u) return setRole(null);
const snap = await getDoc(doc(db, 'users', u.uid));
setRole(snap.data()?.role ?? null);
});
return () => unsub();
}, []);


const logout = async () => {
await signOut(auth);
navigate('/login');
};


return (
<nav className="nav">
<div className="brand">CarConnect</div>
<div className="links">
{role === 'buyer' && <Link to="/buyer">Home</Link>}
{role === 'seller' && <Link to="/seller">Home</Link>}
{role && <Link to="/account">Account</Link>}
{!role && <Link to="/login">Login</Link>}
{role && <button onClick={logout}>Logout</button>}
</div>
</nav>
);
}