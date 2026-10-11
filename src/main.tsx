import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { applyThemeDom, readStoredTheme } from "./store/theme";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";

// Тему ставим до первого рендера, чтобы не мигало белым/чужим цветом.
applyThemeDom(readStoredTheme());

const root = document.getElementById("root");
if (!root) throw new Error("не найден #root");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
