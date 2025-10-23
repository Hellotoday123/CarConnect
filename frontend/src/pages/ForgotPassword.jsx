import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const nav = useNavigate();

  const handleSendReset = async () => {
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ A password renewal link has been sent to your email address.");
      setEmailSent(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with that email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Failed to send reset email. Please try again later.");
      }
    }
  };

  const handleResend = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ The password reset link was sent again. Check your inbox.");
    } catch {
      setError("Failed to resend email. Please try again later.");
    }
  };

  const handleButtonClick = () => {
    if (emailSent) {
      nav("/login");
    } else {
      handleSendReset();
    }
  };

  return (
    <div className="container">
      <h2>Forgot Password</h2>

      {message && <p style={{ color: "#60a5fa", marginBottom: "12px" }}>{message}</p>}
      {error && <p style={{ color: "#f87171", marginBottom: "12px" }}>{error}</p>}

      <input
        className="input"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button className="button" onClick={handleButtonClick}>
        {emailSent ? "Login" : "Send Password Reset Link"}
      </button>

      {/* 👇 This part appears only after email was sent */}
      {emailSent && (
        <p style={{ marginTop: "10px", fontSize: "14px" }}>
          Didn’t receive the email?{" "}
          <span
            style={{ color: "#60a5fa", cursor: "pointer", textDecoration: "underline" }}
            onClick={handleResend}
          >
            Send again
          </span>
        </p>
      )}
    </div>
  );
}