import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Message",
  robots: { index: false, follow: false },
};

export default function MessageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="messenger-shell">{children}</div>;
}
