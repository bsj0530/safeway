import { useCallback, useRef, useState } from "react";

export default function useVoiceGuide() {
  const lastMessageRef = useRef<string>("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const speak = useCallback(
    (message: string) => {
      if (!voiceEnabled) return;
      if (!message || typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;
      if (lastMessageRef.current === message) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ko-KR";
      utterance.rate = 1;
      utterance.pitch = 1;

      lastMessageRef.current = message;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled],
  );

  const resetLastMessage = useCallback(() => {
    lastMessageRef.current = "";
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) {
        window.speechSynthesis?.cancel();
      }
      return next;
    });
  }, []);

  return {
    speak,
    resetLastMessage,
    voiceEnabled,
    toggleVoice,
  };
}
