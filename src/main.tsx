import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('[FRONTEND] React application starting...');
console.log('[FRONTEND] Root element:', document.getElementById("root"));
console.log('[FRONTEND] Environment:', import.meta.env.MODE);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[FRONTEND] ERROR: Root element not found in DOM!');
} else {
  console.log('[FRONTEND] Creating React root and rendering App component...');
  createRoot(rootElement).render(<App />);
  console.log('[FRONTEND] React app rendered successfully');
}
