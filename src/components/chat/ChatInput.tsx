"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Mic, MicOff, Paperclip, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { speechTagFor } from "@/lib/i18n";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  streaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  streaming,
  onStop,
  placeholder = "Ask A-ONE anything… (English, اردو, Roman Urdu)",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || disabled || streaming) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function toggleVoice() {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    try {
      const rec = new SR();
      rec.lang = speechTagFor(value) || "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setValue(transcript);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch (e) {
      setListening(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setValue((v) => `${v}${v ? " " : ""}[Attached file: ${file.name}]`);
    }
    e.target.value = "";
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Listening indicator badge */}
      {listening && (
        <div className="absolute -top-7 left-4 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/50 shadow-xs animate-pulse">
          <span className="size-2 rounded-full bg-red-500" />
          Listening (Speak in English, Urdu or Roman Urdu)...
        </div>
      )}

      <div className="relative flex items-end gap-1.5 sm:gap-2 rounded-2xl bg-card border border-stone-200 dark:border-stone-800 p-2 sm:p-2.5 shadow-lg ring-1 ring-stone-900/5 dark:ring-stone-100/5 transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={onFile}
        />

        {/* Attach File Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-foreground rounded-xl"
          aria-label="Attach a document or image"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || streaming}
          title="Attach file / document"
        >
          <Paperclip className="size-4" />
        </Button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="max-h-36 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm sm:text-base outline-none placeholder:text-muted-foreground/70 leading-relaxed font-sans"
          disabled={disabled}
        />

        {/* Microphone Button */}
        <Button
          type="button"
          variant={listening ? "destructive" : "ghost"}
          size="icon"
          className={cn(
            "size-9 shrink-0 rounded-xl transition-all",
            listening ? "bg-red-500 text-white animate-pulse" : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          onClick={toggleVoice}
          disabled={disabled || streaming}
          title={listening ? "Stop voice recording" : "Voice input"}
        >
          {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        </Button>

        {/* Send / Stop Button */}
        {streaming ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="size-9 shrink-0 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs"
            aria-label="Stop generating"
            onClick={onStop}
            title="Stop generation"
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className={cn(
              "size-9 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all",
              !value.trim() && "opacity-40 hover:opacity-50"
            )}
            aria-label="Send message"
            onClick={submit}
            disabled={disabled || !value.trim()}
            title="Send message (Enter)"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
