import { Metadata } from "next";
import { ChatWindow } from "@/components/chat/ChatWindow";

export const metadata: Metadata = {
  title: "A-ONE Foods | AI Customer Assistant",
  description:
    "Discover A-ONE Foods products, get product information, and connect with the A-ONE Foods team through our AI assistant.",
};

export default function HomePage() {
  return (
    <main className="flex h-dvh w-screen flex-col overflow-hidden bg-background">
      <ChatWindow />
    </main>
  );
}
