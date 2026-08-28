import { useState } from "react";
import { Link } from "react-router-dom";
import { confirmSignUp, signUp } from "../auth/cognito";

export function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"form" | "confirm">("form");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="stack">
      {stage === "form" ? (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await signUp(email, password, name);
              setStage("confirm");
              setMessage("Check your email for a verification code.");
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (12+ chars, mixed case, number, symbol)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} />
          <button className="btn" type="submit">Sign up</button>
        </form>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await confirmSignUp(email, code);
              setMessage("Account confirmed. You can sign in.");
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <input placeholder="Verification code" value={code} onChange={(e) => setCode(e.target.value)} required />
          <button className="btn" type="submit">Confirm account</button>
        </form>
      )}
      {message ? <p className="ok">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <p><Link to="/login">Back to sign in</Link></p>
    </div>
  );
}
