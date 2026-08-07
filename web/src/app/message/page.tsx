import MessageClient from "./MessageClient";
import { LogoMark } from "@/components/ui/LogoLoader";
import { isMessageDisabled, MESSAGE_DOWN_MESSAGE } from "@/lib/messageMaintenance";

export const dynamic = "force-dynamic";

export default async function MessagePage() {
  if (await isMessageDisabled()) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6" aria-hidden="true">
          <LogoMark size={72} tone="light" animate={false} />
        </div>
        <h1 className="text-lg font-semibold text-white">Message</h1>
        <p className="mt-3 max-w-sm text-sm text-white/55">{MESSAGE_DOWN_MESSAGE}</p>
      </div>
    );
  }

  return <MessageClient />;
}
