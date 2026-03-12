import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.jsx"; // App component ko import karna
import "./styles/theme.css";

// Sirf App render karna hai
ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
