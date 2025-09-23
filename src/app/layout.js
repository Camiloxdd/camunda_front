import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
import "./globals.css";

export const metadata = {
  title: 'Camunda Next.js App',
  description: 'Interact with Camunda Tasks',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children} {/* Aquí Next.js renderiza cada página según la ruta */}
      </body>
    </html>
  );
}
