import React, { useState, useEffect, useRef } from "react";
import {
  useDynamicContext,
  useMfa,
  useSyncMfaFlow,
  useIsLoggedIn,
} from "@dynamic-labs/sdk-react-core";
import type { MFADevice } from "@dynamic-labs/sdk-api-core";
import QRCode from "qrcode";

interface MFARegisterData {
  uri: string;
  secret: string;
}

const MfaComponent: React.FC = () => {
  const [userDevices, setUserDevices] = useState<MFADevice[]>([]);
  const [mfaRegisterData, setMfaRegisterData] = useState<
    MFARegisterData | undefined
  >({uri: 'test', secret: 'test'});
  const [currentView, setCurrentView] = useState("devices");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [otpCode, setOtpCode] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const isLogged = useIsLoggedIn();
  const { addDevice, authenticateDevice, getUserDevices, getRecoveryCodes } =
    useMfa();
  const { userWithMissingInfo } = useDynamicContext();

  useEffect(() => {
    if (isLogged) {
      getUserDevices().then(setUserDevices);
    }
  }, [isLogged]);

  useSyncMfaFlow({
    handler: async () => {
      if (userWithMissingInfo?.scope?.includes("requiresAdditionalAuth")) {
        const devices = await getUserDevices();
        if (devices.length === 0) {
          const { uri, secret } = await addDevice();
          setMfaRegisterData({ uri, secret });
          setCurrentView("qr-code");
          QRCode.toCanvas(
            qrCanvasRef.current,
            uri,
            (err) => err && console.error(err)
          );
        } else {
          setCurrentView("otp");
        }
      } else {
        getRecoveryCodes().then(setBackupCodes);
        setCurrentView("backup-codes");
      }
    },
  });

  const handleAddDevice = async () => {
    try {
      const { uri, secret } = await addDevice();
      setMfaRegisterData({ uri, secret });
      setCurrentView("qr-code");
      QRCode.toCanvas(
        qrCanvasRef.current,
        uri,
        (err) => err && console.error(err)
      );
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await authenticateDevice({ code: otpCode });
      setCurrentView("backup-codes");
      getRecoveryCodes().then(setBackupCodes);
      setUserDevices(await getUserDevices());
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="pt-6 mt-6">
      <p className="font-bold text-primary mb-4">
        Multi-Factor Authentication
      </p>
      {currentView === "devices" && (
        <div className="space-y-4">
          <p className="text-gray-700">
            Devices:{" "}
            {userDevices.length === 0 ? "None" : JSON.stringify(userDevices)}
          </p>
          <button
            onClick={handleAddDevice}
            className="w-full bg-blue-100 border border-blue-200 text-gray-800 p-3 rounded-md hover:bg-teal-500 transition"
          >
            Add MFA Device
          </button>
        </div>
      )}
      {currentView === "qr-code" && mfaRegisterData && (
        <div className="space-y-4">
          <p className="text-gray-700">
            Scan this QR code with your authenticator app:
          </p>
          <canvas ref={qrCanvasRef} className="mx-auto" />
          <p className="text-gray-700">
            Secret: <span className="font-mono">{mfaRegisterData.secret}</span>
          </p>
          <button
            onClick={() => setCurrentView("otp")}
            className="bg-accent bg-blue-100 text-gray-800 p-3 rounded-md hover:bg-teal-500 transition"
          >
            Continue to OTP
          </button>
        </div>
      )}
      {currentView === "otp" && (
        <div className="space-y-4">
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter OTP"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="MFA OTP code"
          />
          <button
            onClick={handleVerifyOtp}
            className="w-full bg-blue-100 bg-accent text-gray-800 p-3 rounded-md hover:bg-teal-500 transition"
          >
            Verify OTP
          </button>
        </div>
      )}
      {currentView === "backup-codes" && (
        <div className="space-y-4">
          <p className="text-gray-700">Backup Codes (save these securely):</p>
          <ul className="list-disc pl-5">
            {backupCodes.map((code, idx) => (
              <li key={idx} className="text-gray-700 font-mono">
                {code}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
    </div>
  );
};

export default MfaComponent;
