import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { LenderAuthProvider } from "./context/LenderAuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <LenderAuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>  
        </ThemeProvider>
      </LenderAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);