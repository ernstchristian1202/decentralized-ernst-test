import React from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

import "./App.css";

import Login from "./pages/Login.tsx";
import Signer from "./pages/Signer.tsx";

const App: React.FC = () => {
  const { user } = useDynamicContext();

  if (!user) {
    return <Login />;
  }

  return <Signer />;
};

export default App;
