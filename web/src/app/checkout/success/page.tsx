import { Suspense } from "react";
import ClientSuccess from "./ClientSuccess";

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container py-12 text-center">
        <div className="text-lg text-neutral-900">Confirming your order...</div>
      </div>
    }>
      <ClientSuccess />
    </Suspense>
  );
}


