import type { Metadata } from "next";
import { getAllMessages } from "@/lib/adminData";
import { MessageManager } from "@/components/admin/messages/MessageManager";

export const metadata: Metadata = { title: "Mensagens · Admin" };

export default async function AdminMessagesPage() {
  const messages = await getAllMessages();
  return <MessageManager items={messages} />;
}
