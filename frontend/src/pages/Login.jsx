import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, googleProvider } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); // 👈 new error state
  const nav = useNavigate();

  // Email/password login
  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); // clear error on submit

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      if (!user.emailVerified) {
        setErrorMsg("Please verify your email before logging in.");
        return;
      }

      const profile = await getDoc(doc(db, "users", user.uid));
      const role = profile.data()?.role;
      nav(role === "seller" ? "/seller" : "/buyer");
    } catch (err) {
      // Handle specific Firebase errors
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setErrorMsg("Email or password is incorrect.");
      } else {
        setErrorMsg(err.message);
      }
    }
  };

  // Google sign-in
  const signInWithGoogle = async () => {
    const { user } = await signInWithPopup(auth, googleProvider);
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        firstName: "",
        lastName: "",
        phone: "",
        role: null,
      });
      nav("/choose-role");
      return;
    }

    const role = snap.data()?.role;
    nav(role === "seller" ? "/seller" : "/buyer");
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="button">Login</button>

        {/* 🔴 Error message */}
        {errorMsg && (
          <p style={{ color: "#f87171", marginTop: "10px", fontWeight: "500" }}>
            {errorMsg}
          </p>
        )}
      </form>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Link to="/register">Register</Link>
        <Link to="/forgot">Forgot password</Link>
      </div>

      {/* Google Sign-In Button */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <p style={{ marginBottom: 8, opacity: 0.7 }}>or</p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="button"
          style={{
            backgroundColor: "#fff",
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: "600",
          }}
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            width="20"
            height="20"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}