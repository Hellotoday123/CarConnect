import { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';


export default function Register(){
const [form, setForm] = useState({ email:'', password:'', name:'', phone:'', role:'buyer' });
const nav = useNavigate();


const submit = async (e) => {
e.preventDefault();
const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
await updateProfile(user, { displayName: form.name });
await setDoc(doc(db, 'users', user.uid), {
uid: user.uid,
role: form.role,
displayName: form.name,
email: form.email,
phone: form.phone
});
nav(form.role === 'seller' ? '/seller' : '/buyer');
};


return (
<div className="container">
<h2>Create Account</h2>
<form onSubmit={submit}>
<div className="formRow">
<input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
<select className="select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
<option value="buyer">Buyer</option>
<option value="seller">Seller</option>
</select>
</div>
<input className="input" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
<input className="input" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
<input className="input" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
<button className="button">Register</button>
</form>
</div>
);
}