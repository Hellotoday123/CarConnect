import { auth } from "../services/firebase";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
      else if (user.emailVerified) navigate("/login");
      else setEmail(user.email);
    });
    return () => unsub();
  }, [navigate]);

  const resendEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
    }
  };

  return (
    <div className="container">
      <h2>Verify Your Email</h2>
      <p>
        A verification link has been sent to <strong>{email}</strong>.
        <br />Please check your inbox and verify your account.
      </p>

      <div style={{ marginTop: 20 }}>
        {!sent ? (
          <button className="button" onClick={resendEmail}>
            Resend Email
          </button>
        ) : (
          <p>Verification email re-sent! Check your inbox again.</p>
        )}
      </div>

      <button className="button" onClick={() => navigate("/login")} style={{ marginTop: 10 }}>
        Go to Login
      </button>
    </div>
  );
}