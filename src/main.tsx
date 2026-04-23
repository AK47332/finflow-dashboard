import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </ThemeProvider>,
);
