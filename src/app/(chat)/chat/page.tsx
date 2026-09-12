import { Metadata } from "next";
import { ChatWindow } from "@/components/chat/ChatWindow";

export const metadata: Metadata = {
  title: "A-ONE Foods | AI Customer Assistant",
  description:
    "Chat with the official A-ONE Foods AI Assistant — product discovery, ingredients, packaging, distributor inquiries, and customer support.",
};

export default function ChatPage() {
  return (
    <main className="flex h-dvh w-screen flex-col overflow-hidden bg-background">
      <ChatWindow />
    </main>
  );
}
