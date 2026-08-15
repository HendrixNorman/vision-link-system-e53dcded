import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BrandThemeSync } from "./components/BrandThemeSync";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrandThemeSync />
    <App />
  </ThemeProvider>
);
