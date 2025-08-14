import React, { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faMessage,
  faSignOut,
} from "@fortawesome/free-solid-svg-icons";

import MfaComponent from "../components/MfaComponents.tsx";
import { useCopyToClipboard } from "usehooks-ts";
import { Bounce, ToastContainer, toast } from "react-toastify";

interface History {
  message: string;
  signature: string;
  isValid: boolean;
  signer: string;
}

const Signer = () => {
  const { primaryWallet, handleLogOut } = useDynamicContext();
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<History[]>([]);
  const [result, setResult] = useState<{
    isValid: boolean;
    signer: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, copyToClipboard] = useCopyToClipboard();

  useEffect(() => {
    const storedHistory = localStorage.getItem("signHistory");
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem("signHistory", JSON.stringify(history));
  }, [history]);

  const signMessage = async () => {
    if (!primaryWallet) return;
    setIsLoading(true);
    try {
      const signature = (await primaryWallet.signMessage(message)) ?? "";
      const res = await fetch(import.meta.env.VITE_APP_SERVER, {
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => () => {
    copyToClipboard(text)
      .then(() => {
        toast("Address is copied!");
      })
      .catch((error) => {
        toast("Failed to copy address!");
        console.error("Failed to copy!", error);
      });
  };

  return (
    <div className="bg-gray-100 rounded-xl p-4">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Web3 Message Signer
        </h1>
        <button onClick={handleLogOut} className="text-accent hover:underline">
          <FontAwesomeIcon icon={faSignOut} className="mr-2" />
          Logout
        </button>
      </div>
      <div className="rounded-lg flex gap-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6">
            <p className="font-bold">Connected Wallet</p>
            <p className="text-gray-700 bg-blue-100 px-2 py-1 rounded-xl flex gap-6 items-center">
              <span className="font-semibold ml-1">
                {`Connected:${primaryWallet?.address.slice(
                  0,
                  6
                )}...${primaryWallet?.address?.slice(-5)}`}
              </span>
              <button onClick={handleCopy(primaryWallet?.address ?? "")}>
                <FontAwesomeIcon icon={faCopy} />
              </button>
            </p>
          </div>
          <MfaComponent />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              signMessage();
            }}
            className="space-y-4 mb-6 mt-4"
          >
            <label htmlFor="message" className="font-bold">
              Enter your message to sign & verify
            </label>
            <input
              type="text"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
              aria-label="Message to sign"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white p-3 rounded-md bg-blue-400 hover:bg-blue-500 transition disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Sign & Verify"}
            </button>
          </form>
          {result && (
            <div className="p-4 bg-green-50 rounded-md mb-6">
              <p className="text-gray-700">
                Signature Valid:{" "}
                <span
                  className={result.isValid ? "text-green-500" : "text-red-500"}
                >
                  {result.isValid ? "Yes" : "No"}
                </span>
              </p>
              <p className="text-gray-700">
                Signed by:{" "}
                <span className="font-semibold">{result.signer}</span>
              </p>
            </div>
          )}
          {error && <p className="text-red-500 mb-6">{error}</p>}
        </div>

        <div className="p-8 min-w-xl bg-white rounded-xl">
          <h2 className="text-xl font-semibold text-primary mb-4">History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500">No messages signed yet.</p>
          ) : (
            <ul className="space-y-4 overflow-auto">
              {history.map((item, idx) => (
                <li key={idx} className="p-4 bg-gray-50 rounded-md flex gap-2">
                  <div>
                    <FontAwesomeIcon icon={faMessage} />
                  </div>
                  <div>
                    <p>{item.message}</p>
                    <p>
                      <strong>Valid:</strong>{" "}
                      <span
                        className={
                          item.isValid ? "text-green-500" : "text-red-500"
                        }
                      >
                        {item.isValid ? "Yes" : "No"}
                      </span>
                    </p>
                    <p>
                      {`${primaryWallet?.address.slice(
                        0,
                        6
                      )}...${primaryWallet?.address?.slice(-6)}`}
                      <button
                        onClick={handleCopy(primaryWallet?.address ?? "")}
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </div>
  );
};

export default Signer;
