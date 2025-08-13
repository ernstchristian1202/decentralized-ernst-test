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
  >();
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
    <div className="mfa-section">
      <h2>Multi-Factor Authentication (Bonus)</h2>
      {currentView === "devices" && (
        <div>
          <p>Devices: {JSON.stringify(userDevices)}</p>
          <button onClick={handleAddDevice}>Add MFA Device</button>
        </div>
      )}
      {currentView === "qr-code" && mfaRegisterData && (
        <div>
          <p>Scan QR Code</p>
          <canvas ref={qrCanvasRef} />
          <p>Secret: {mfaRegisterData.secret}</p>
          <button onClick={() => setCurrentView("otp")}>Continue to OTP</button>
        </div>
      )}
      {currentView === "otp" && (
        <div>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter OTP"
          />
          <button onClick={handleVerifyOtp}>Verify</button>
        </div>
      )}
      {currentView === "backup-codes" && (
        <div>
          <p>Backup Codes:</p>
          <ul>
            {backupCodes.map((code, idx) => (
              <li key={idx}>{code}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default MfaComponent;
