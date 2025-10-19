import { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';


export default function Account(){
const [form, setForm] = useState({ name:'', phone:'', role:'' });
const [pwd, setPwd] = useState('');


useEffect(() => {
(async () => {
const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
const data = snap.data();
setForm({ name: data.displayName, phone: data.phone, role: data.role });
})();
}, []);


const save = async () => {
await updateDoc(doc(db, 'users', auth.currentUser.uid), {
displayName: form.name,
phone: form.phone
});
alert('Saved');
};


const changePassword = async () => {
if (!pwd) return;
await updatePassword(auth.currentUser, pwd);
setPwd('');
alert('Password updated');
};


return (
<div className="container">
<h2>Account</h2>
<div className="formRow">
<input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" />
<input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone" />
<input className="input" value={form.role} disabled />
</div>
<button className="button" onClick={save}>Save</button>


<h3>Change Password</h3>
<input className="input" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="New password" />
<button className="button" onClick={changePassword}>Update Password</button>
</div>
);
}