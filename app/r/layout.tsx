import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redirecting...",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
    },
  },
};

export default function RedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
