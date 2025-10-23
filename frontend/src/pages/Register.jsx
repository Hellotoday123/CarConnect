import { useState } from "react";
import { auth, db } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "", // <- force user to choose
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.lastName || !form.displayName) {
      return setError("Please fill in your first name, last name, and display name.");
    }
    if (!form.email) return setError("Please enter your email.");
    if (!["buyer", "seller"].includes(form.role)) {
      return setError("Please select a role.");
    }
    if (!form.password || !form.confirmPassword) {
      return setError("Please enter and re-enter your password.");
    }
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setSubmitting(true);

      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await updateProfile(user, { displayName: form.displayName });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        displayName: form.displayName,
        email: form.email,
        phone: form.phone,
      });

      await sendEmailVerification(user);
      nav("/verify-email");
    } catch (err) {
      setError(err.message || "Failed to register.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h2>Create Account</h2>

      {error && (
        <p style={{ color: "#f87171", marginBottom: 12, fontWeight: 500 }}>
          {error}
        </p>
      )}

      <form onSubmit={submit}>
        {/* First and Last Name */}
        <div className="formRow">
          <input
            className="input"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>

        {/* Display Name and Role (dropdown) */}
        <div className="formRow">
          <input
            className="input"
            placeholder="Display Name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <select
            className="select"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="">Select Role</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
        </div>

        {/* Contact info */}
        <input
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        {/* Password */}
        <div className="password-field">
          <input
            className="input"
            type={showPwd ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="button"
            className="eye-btn"
            onMouseDown={() => setShowPwd(true)}
            onMouseUp={() => setShowPwd(false)}
            onMouseLeave={() => setShowPwd(false)}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="password-field">
          <input
            className="input"
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />
          <button
            type="button"
            className="eye-btn"
            onMouseDown={() => setShowConfirm(true)}
            onMouseUp={() => setShowConfirm(false)}
            onMouseLeave={() => setShowConfirm(false)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button className="button" disabled={submitting}>
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}