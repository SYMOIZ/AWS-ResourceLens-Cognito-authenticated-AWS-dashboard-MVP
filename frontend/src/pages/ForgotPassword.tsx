import { useState } from "react";
import { Link } from "react-router-dom";
import { confirmForgotPassword, forgotPassword } from "../auth/cognito";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"request" | "confirm">("request");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="stack">
      {stage === "request" ? (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await forgotPassword(email);
              setStage("confirm");
              setMessage("If the account exists, a reset code was emailed.");
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn" type="submit">Send reset code</button>
        </form>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await confirmForgotPassword(email, code, password);
              setMessage("Password updated. You can sign in.");
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <input placeholder="Reset code" value={code} onChange={(e) => setCode(e.target.value)} required />
          <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} />
          <button className="btn" type="submit">Update password</button>
        </form>
      )}
      {message ? <p className="ok">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <p><Link to="/login">Back to sign in</Link></p>
    </div>
  );
}
