import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';


export default function Login(){
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const nav = useNavigate();


const submit = async (e) => {
e.preventDefault();
const { user } = await signInWithEmailAndPassword(auth, email, password);
const profile = await getDoc(doc(db, 'users', user.uid));
const role = profile.data()?.role;
nav(role === 'seller' ? '/seller' : '/buyer');
};


return (
<div className="container">
<h2>Login</h2>
<form onSubmit={submit}>
<input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
<input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
<button className="button">Login</button>
</form>
<div style={{display:'flex', gap:12}}>
<Link to="/register">Register</Link>
<Link to="/forgot">Forgot password</Link>
</div>
</div>
);
}