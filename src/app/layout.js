import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

import "./globals.css";
import ClientToast from "../../src/app/components/ClientToast"; // 👈 importas el cliente
import { poppins } from "../../public/fonts/fonts";

export const metadata = {
  title: "Requisición de compras",

};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.className}`}>
        {children}
        <ClientToast />
      </body>
    </html>
  );
}
