import React from "react";
import { createRoot } from "react-dom/client";
import AppV2 from "./AppV2.jsx"; // V2.0 avec Kalman + FSM + Fresnel
createRoot(document.getElementById("root")).render(<AppV2 />);
