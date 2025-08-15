import { useState, useEffect } from "react";
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
  const [_, setResult] = useState<{
    isValid: boolean;
    signer: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        { message, signature, isValid: data.isValid, signer: data.signer },
        ...history,
      ]);
      toast("Signing success!", { type: "success" });
      setMessage("");
    } catch (err) {
      console.error(err);
      toast("Signing failed", { type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => () => {
    copyToClipboard(text)
      .then(() => {
        toast("Address is copied!", { type: "success" });
      })
      .catch((error) => {
        toast("Failed to copy address!", { type: "error" });
        console.error("Failed to copy!", error);
      });
  };

  return (
    <div className="bg-gray-100 rounded-xl p-4 max-h-[85vh] flex flex-col justify-between">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Web3 Message Signer
        </h1>
        <button onClick={handleLogOut} className="text-accent hover:underline">
          <FontAwesomeIcon icon={faSignOut} className="mr-2" />
          Logout
        </button>
      </div>
      <div className="rounded-lg flex gap-4 max-h-[70vh]">
        <div className="space-y-4 max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg flex flex-col justify-around">
          <div>
            <p className="font-bold">Connected Wallet</p>
            <p className="text-gray-700 bg-blue-100 px-2 py-1 rounded-xl flex items-center justify-between">
              <div className="font-semibold">
                Connected: &nbsp;&nbsp;
                <span className="text-blue-500">
                  {`${primaryWallet?.address.slice(
                    0,
                    9
                  )}... ... ${primaryWallet?.address?.slice(-8)}`}
                </span>
              </div>
              <button style={{ outline: 'none' }} onClick={handleCopy(primaryWallet?.address ?? "")}>
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
            className="space-y-4"
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
        </div>

        <div className="p-8 min-w-xl bg-white rounded-xl overflow-auto relative flex flex-col">
          <h2 className="text-xl font-semibold text-primary mb-4">History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500">No messages signed yet.</p>
          ) : (
            <ul className="space-y-4 overflow-auto w-full max-h-[89%]">
              {history.map((item) => (
                <li
                  key={`${item.signature}`}
                  className="p-4 bg-gray-50 rounded-md flex gap-2 animate__animated animate__bounceInDown"
                >
                  <div>
                    <FontAwesomeIcon icon={faMessage} />
                  </div>
                  <div className="flex flex-col w-[90%]">
                    <p className="w-[90%] truncate">{item.message}</p>
                    <p>
                      <strong>Signature Valid:</strong>
                      &nbsp;&nbsp;
                      <span
                        className={
                          item.isValid ? "text-green-500" : "text-red-500"
                        }
                      >
                        {item.isValid ? "Yes" : "No"}
                      </span>
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="font-bold">
                        Signed by: &nbsp;&nbsp; <span className="text-blue-500">
                        {`${primaryWallet?.address.slice(
                          0,
                          9
                        )}... ... ${primaryWallet?.address?.slice(-8)}`}
                        </span>
                      </div>
                      <button
                        style={{ outline: 'none' }}
                        className="p-0!"
                        onClick={handleCopy(primaryWallet?.address ?? "")}
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                    </div>
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
