import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import timeLap from "./components/timeLap";
config.autoAddCss = false;

import "./globals.css";
import ClientToast from "../../src/app/components/ClientToast"; // 👈 importas el cliente

export const metadata = {
  title: "Camunda Next.js App",
  description: "Interact with Camunda Tasks",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ClientToast />
      </body>
    </html>
  );
}
