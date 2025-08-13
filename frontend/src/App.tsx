import React, { useState, useEffect } from "react";
import {
  useDynamicContext,
  useConnectWithOtp,
} from "@dynamic-labs/sdk-react-core";
import "./App.css";
import MfaComponent from "./components/MfaComponents.tsx";

interface History {
  message: string;
  signature: string;
  isValid: boolean;
  signer: string;
}

const App: React.FC = () => {
  const { user, primaryWallet, handleLogOut } = useDynamicContext();
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<History[]>([]);
  const [result, setResult] = useState<{
    isValid: boolean;
    signer: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedHistory = localStorage.getItem("signHistory");
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem("signHistory", JSON.stringify(history));
  }, [history]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await connectWithEmail(email);
      setShowOtp(true);
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyOneTimePassword(otp);
      setShowOtp(false);
    } catch (err) {
      console.error(err);
      setError("Invalid OTP");
    }
  };

  const signMessage = async () => {
    if (!primaryWallet) return;
    try {
      const signature = (await primaryWallet.signMessage(message)) ?? "";
      const res = await fetch("http://localhost:3000/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      const data = await res.json();
      setResult(data);
      setHistory([
        ...history,
        { message, signature, isValid: data.isValid, signer: data.signer },
      ]);
      setMessage("");
    } catch (err) {
      console.error(err);
      setError("Signing failed");
    }
  };

  if (!user) {
    return (
      <div className="container">
        <h1>Login with Email</h1>
        {!showOtp ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <button type="submit">Send OTP</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP"
              required
            />
            <button type="submit">Verify</button>
          </form>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Web3 Message Signer</h1>
      <p>Connected Wallet: {primaryWallet?.address}</p>
      <button onClick={handleLogOut}>Logout</button>
      <MfaComponent />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          signMessage();
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message"
          required
        />
        <button type="submit">Sign & Verify</button>
      </form>
      {result && (
        <div>
          <p>Signature Valid: {result.isValid ? "Yes" : "No"}</p>
          <p>Signed by: {result.signer}</p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <h2>History</h2>
      <ul>
        {history.map((item, idx) => (
          <li key={idx}>
            Message: {item.message} | Valid: {item.isValid ? "Yes" : "No"} |
            Signer: {item.signer}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
