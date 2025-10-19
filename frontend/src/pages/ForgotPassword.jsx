import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';


export default function ForgotPassword(){
const [email, setEmail] = useState('');
const [sent, setSent] = useState(false);


const submit = async (e) => {
e.preventDefault();
await sendPasswordResetEmail(auth, email);
setSent(true);
};


return (
<div className="container">
<h2>Reset Password</h2>
<form onSubmit={submit}>
<input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
<button className="button">Send Reset Link</button>
</form>
{sent && <p>Verification link sent to your email.</p>}
</div>
);
}