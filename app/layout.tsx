import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-arabic/300.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "عقل ثاني | فيزياء البكالوريا",
    template: "%s — عقل ثاني",
  },
  description:
    "منصة محادثة تعليمية ذكية لتلاميذ البكالوريا الجزائرية: شرح الدروس وحل التمارين ومراجعة أهم أفكار علوم الفيزياء خطوة بخطوة.",
  applicationName: "عقل ثاني",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeInit = `(function(){try{var s=localStorage.getItem('aqel-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=s!=null?s==='dark':d;var h=document.documentElement;h.classList.toggle('dark',dark);h.style.colorScheme=dark?'dark':'light';}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
