import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';


export default function ProtectedRoute() {
const [state, setState] = useState({ loading: true, allowed: false });


useEffect(() => {
const unsub = onAuthStateChanged(auth, async (user) => {
if (!user) return setState({ loading: false, allowed: false });
// Ensure the user has a profile doc
const snap = await getDoc(doc(db, 'users', user.uid));
setState({ loading: false, allowed: snap.exists() });
});
return () => unsub();
}, []);


if (state.loading) return <p style={{ padding: 24 }}>Loading...</p>;
return state.allowed ? <Outlet /> : <Navigate to="/login" replace />;
}