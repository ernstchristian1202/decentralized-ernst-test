import { useState } from "react";

import { useConnectWithOtp } from "@dynamic-labs/sdk-react-core";

const Login = () => {
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await connectWithEmail(email);
      setShowOtp(true);
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyOneTimePassword(otp);
      setShowOtp(false);
    } catch (err) {
      console.error(err);
      setError("Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">
          Web3 Signer Login
        </h1>
        {!showOtp ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-300 text-white p-3 rounded-md hover:bg-green-500 transition disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
              aria-label="OTP code"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-300 text-white p-3 rounded-md hover:bg-green-500 transition disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
