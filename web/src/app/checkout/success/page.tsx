import { Suspense } from "react";
import ClientSuccess from "./ClientSuccess";

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container py-12 text-center">
        <div className="text-lg">Confirming your order...</div>
      </div>
    }>
      <ClientSuccess />
    </Suspense>
  );
}


