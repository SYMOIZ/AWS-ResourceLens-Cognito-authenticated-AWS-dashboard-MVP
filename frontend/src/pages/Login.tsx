import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await signIn(email, password);
        } catch (err) {
          setError((err as Error).message || "Sign in failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="muted">Sign in with Amazon Cognito. AWS access keys are never requested.</p>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error ? <p className="error">{error}</p> : null}
      <button className="btn" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      <p><Link to="/signup">Create an account</Link></p>
      <p><Link to="/forgot-password">Forgot password</Link></p>
    </form>
  );
}
