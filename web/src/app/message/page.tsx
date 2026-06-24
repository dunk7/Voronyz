import Image from "next/image";
import MessageClient from "./MessageClient";
import { isMessageDisabled, MESSAGE_DOWN_MESSAGE } from "@/lib/messageMaintenance";

export const dynamic = "force-dynamic";

export default async function MessagePage() {
  if (await isMessageDisabled()) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <Image
          src="/logo.png"
          alt="Voronyz"
          width={72}
          height={72}
          className="mb-6 rounded-2xl"
          priority
        />
        <h1 className="text-lg font-semibold text-white">Message</h1>
        <p className="mt-3 max-w-sm text-sm text-white/55">{MESSAGE_DOWN_MESSAGE}</p>
      </div>
    );
  }

  return <MessageClient />;
}
