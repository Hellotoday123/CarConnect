import { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs
} from 'firebase/firestore';
import {
  updatePassword, deleteUser, reauthenticateWithCredential,
  EmailAuthProvider, signOut
} from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Account() {
  const [form, setForm] = useState({ name: '', phone: '', role: '', email: '' });
  const [original, setOriginal] = useState({ name: '', phone: '', role: '', email: '' });
  const [editMode, setEditMode] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      const snap = await getDoc(doc(db, 'users', uid));
      const data = snap.exists() ? snap.data() : {};

      const loaded = {
        email: auth.currentUser.email || '',
        name: data.displayName || '',
        phone: data.phone || '',
        role: data.role || '',
      };
      setForm(loaded);
      setOriginal(loaded);
    })();
  }, []);

  const save = async () => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      displayName: form.name,
    });
    setOriginal(prev => ({ ...prev, name: form.name }));
    setEditMode(false);
    alert('Saved');
  };

  const cancel = () => {
    setForm(original);
    setEditMode(false);
  };

  const changePassword = async () => {
    if (!auth.currentUser) return;

    if (!currentPwd || !newPwd) {
      alert('Please enter your current password and a new password.');
      return;
    }

    if (currentPwd === newPwd) {
      alert('Your new password cannot be the same as your current password.');
      return;
    }

    try {
      // Step 1: reauthenticate
      const cred = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPwd
      );
      await reauthenticateWithCredential(auth.currentUser, cred);

      // Step 2: update password
      await updatePassword(auth.currentUser, newPwd);

      setCurrentPwd('');
      setNewPwd('');
      alert('Password updated successfully.');
    } catch (err) {
      const msg =
        err?.code === 'auth/wrong-password'
          ? 'Current password is incorrect.'
          : err?.code === 'auth/weak-password'
          ? 'New password is too weak. Try a stronger one.'
          : err?.message || 'Failed to update password.';
      alert(msg);
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;

    const confirmDelete = confirm(
      'Delete your account permanently?\nThis will remove your profile and (if seller) your listed cars.'
    );
    if (!confirmDelete) return;

    const password = prompt('Please re-enter your password to confirm account deletion:');
    if (!password) return;

    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, cred);

      const uid = auth.currentUser.uid;
      if (form.role === 'seller') {
        const qRef = query(collection(db, 'cars'), where('sellerId', '==', uid));
        const snap = await getDocs(qRef);
        const deletions = snap.docs.map(d => deleteDoc(doc(db, 'cars', d.id)));
        await Promise.all(deletions);
      }

      await deleteDoc(doc(db, 'users', uid));
      await deleteUser(auth.currentUser);

      alert('Your account has been deleted.');
      await signOut(auth);
      nav('/login');
    } catch (err) {
      alert(err.message || 'Failed to delete account. Please check your password.');
    }
  };

  return (
    <div className="container">
      <h2>Account</h2>

      {/* Display section */}
      <div style={{ marginBottom: 20, lineHeight: '1.8' }}>
        <p>
          <strong>Username:</strong>{' '}
          {editMode ? (
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Display Name"
              style={{ maxWidth: 300 }}
            />
          ) : (
            form.name || '—'
          )}
        </p>
        <p><strong>Email:</strong> {form.email || '—'}</p>
        <p><strong>Phone:</strong> {form.phone || '—'}</p>
        <p><strong>Role:</strong> {form.role || '—'}</p>

        {!editMode ? (
          <button className="button" onClick={() => setEditMode(true)}>Edit</button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button" onClick={save}>Save</button>
            <button className="button" onClick={cancel} style={{ background: '#94a3b8' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <h3>Change Password</h3>

      {/* Current password field */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          className="input"
          type={showCurrent ? 'text' : 'password'}
          value={currentPwd}
          onChange={e => setCurrentPwd(e.target.value)}
          placeholder="Current password"
        />
        <span
          onClick={() => setShowCurrent(!showCurrent)}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: '#60a5fa'
          }}
        >
          {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
        </span>
      </div>

      {/* New password field */}
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type={showNew ? 'text' : 'password'}
          value={newPwd}
          onChange={e => setNewPwd(e.target.value)}
          placeholder="New password"
        />
        <span
          onClick={() => setShowNew(!showNew)}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: '#60a5fa'
          }}
        >
          {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
        </span>
      </div>

      <button className="button" onClick={changePassword} style={{ marginTop: 8 }}>
        Update Password
      </button>

      {/* Danger Zone */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #334155' }}>
        <h3 style={{ color: '#f87171' }}>Danger Zone</h3>
        <button
          className="button"
          onClick={deleteAccount}
          style={{ background: '#ef4444', color: '#0b1220', fontWeight: 800 }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}