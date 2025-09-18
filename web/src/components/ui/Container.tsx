import { PropsWithChildren } from "react";

export default function Container({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`container ${className}`}>{children}</div>;
}


