import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  HiOutlineMicrophone,
  HiOutlinePaperAirplane,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineSparkles,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import "./AIAssistant.css";

const STARTER_PROMPTS = [
  "Give me 3 blog title ideas for a founder-focused article.",
  "Turn this rough topic into a sharper outline for my next post.",
  "Write a clean intro paragraph for a professional tech blog.",
  "Summarize my article into a strong one-line excerpt.",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Need help with a title, outline, summary, or sharper blog copy? Ask here.",
};

function AIAssistant() {
  const location = useLocation();
  const { user } = useAuth();
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const sendMessageRef = useRef(null);
  const messagesRef = useRef([INITIAL_MESSAGE]);
  const loadingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [supportsListening, setSupportsListening] = useState(false);
  const [supportsSpeaking, setSupportsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, open]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const canSpeak =
      typeof window.speechSynthesis !== "undefined" &&
      typeof window.SpeechSynthesisUtterance !== "undefined";

    setSupportsListening(Boolean(Recognition));
    setSupportsSpeaking(canSpeak);

    if (!Recognition) {
      return undefined;
    }

    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      transcriptRef.current = "";
      setIsListening(true);
      setVoiceStatus("Listening now. Speak your prompt.");
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      transcriptRef.current = transcript;
      setInput(transcript);
      setVoiceStatus(
        transcript
          ? "Prompt captured. Releasing the mic will send it."
          : "Listening now. Speak your prompt."
      );
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setVoiceStatus(
        event.error === "not-allowed"
          ? "Microphone permission is blocked in this browser."
          : "Voice input could not start. Try typing instead."
      );
    };

    recognition.onend = () => {
      const spokenPrompt = transcriptRef.current.trim();

      setIsListening(false);

      if (spokenPrompt && sendMessageRef.current && !loadingRef.current) {
        transcriptRef.current = "";
        setVoiceStatus("Sending your spoken prompt...");
        void sendMessageRef.current(spokenPrompt, { speakReply: true });
        return;
      }

      if (!spokenPrompt) {
        setVoiceStatus("No voice prompt detected. Try again.");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;

      if (canSpeak) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text) => {
    if (
      typeof window === "undefined" ||
      !supportsSpeaking ||
      !text.trim()
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceStatus("Speaking the latest answer.");
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceStatus("Voice reply finished.");
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setVoiceStatus("Voice reply could not be played.");
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !supportsSpeaking) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceStatus("Voice reply stopped.");
  };

  const sendMessage = async (text, options = {}) => {
    const trimmedText = text.trim();

    if (!trimmedText || loadingRef.current) {
      return;
    }

    const nextUserMessage = {
      role: "user",
      content: trimmedText,
    };

    const history = messagesRef.current
      .filter((message) => message !== INITIAL_MESSAGE)
      .slice(-6)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((currentMessages) => {
      const nextMessages = [...currentMessages, nextUserMessage];
      messagesRef.current = nextMessages;
      return nextMessages;
    });
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/assistant/chat", {
        message: trimmedText,
        history,
        context: {
          page: location.pathname,
          user: user?.name || user?.username || "Guest",
        },
      });

      setNotice(data.notice || "");
      setMessages((currentMessages) => {
        const nextMessages = [
          ...currentMessages,
          {
            role: "assistant",
            content: data.reply,
          },
        ];

        messagesRef.current = nextMessages;
        return nextMessages;
      });

      if (options.speakReply && supportsSpeaking) {
        speakText(data.reply);
      } else {
        setVoiceStatus("");
      }
    } catch (error) {
      console.error("Assistant error:", error);

      setMessages((currentMessages) => {
        const nextMessages = [
          ...currentMessages,
          {
            role: "assistant",
            content:
              error.response?.data?.message ||
              "Assistant is unavailable right now. Check your backend AI configuration.",
          },
        ];

        messagesRef.current = nextMessages;
        return nextMessages;
      });
      setVoiceStatus("The prompt could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  sendMessageRef.current = sendMessage;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleToggleListening = () => {
    if (!supportsListening || !recognitionRef.current) {
      setVoiceStatus("Voice input is not supported in this browser.");
      return;
    }

    if (loadingRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    try {
      setVoiceStatus("Preparing microphone...");
      recognitionRef.current.start();
    } catch (error) {
      console.error("Speech recognition error:", error);
      setVoiceStatus("Microphone is busy. Try again in a moment.");
    }
  };

  const latestAssistantReply =
    [...messages]
      .reverse()
      .find((message) => message.role === "assistant" && message.content.trim())
      ?.content || INITIAL_MESSAGE.content;

  const handleToggleSpeakReply = () => {
    if (!supportsSpeaking) {
      setVoiceStatus("Voice playback is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    speakText(latestAssistantReply);
  };

  const handleClose = () => {
    recognitionRef.current?.stop();
    stopSpeaking();
    setOpen(false);
  };

  return (
    <div className={`ai-assistant${open ? " is-open" : ""}`}>
      {open ? (
        <div className="ai-assistant__panel glass-panel">
          <div className="ai-assistant__header">
            <div>
              <span className="ai-assistant__label">AI assistant</span>
              <strong>Atlas writing copilot</strong>
            </div>

            <button
              type="button"
              className="ai-assistant__close"
              onClick={handleClose}
              aria-label="Close assistant"
            >
              <HiOutlineXMark />
            </button>
          </div>

          {notice && <p className="ai-assistant__notice">{notice}</p>}

          <div className="ai-assistant__voice">
            <div className="ai-assistant__voice-actions">
              <button
                type="button"
                className={`ai-assistant__voice-button${
                  isListening ? " is-active" : ""
                }`}
                onClick={handleToggleListening}
                disabled={loading}
              >
                <HiOutlineMicrophone />
                {isListening ? "Listening" : "Listen"}
              </button>

              <button
                type="button"
                className={`ai-assistant__voice-button${
                  isSpeaking ? " is-active" : ""
                }`}
                onClick={handleToggleSpeakReply}
              >
                {isSpeaking ? <HiOutlineSpeakerXMark /> : <HiOutlineSpeakerWave />}
                {isSpeaking ? "Stop voice" : "Speak answer"}
              </button>
            </div>

            <p className="ai-assistant__voice-status">
              {voiceStatus ||
                "Use quick prompts, type a message, or ask with your microphone."}
            </p>
          </div>

          <div className="ai-assistant__prompt-block">
            <span className="ai-assistant__prompt-label">Prompt shortcuts</span>
            <div className="ai-assistant__prompts">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="ai-assistant__prompt"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-assistant__messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`ai-assistant__message ai-assistant__message--${message.role}`}
              >
                <span className="ai-assistant__message-role">
                  {message.role === "assistant" ? "Assistant" : "You"}
                </span>
                <p>{message.content}</p>
              </div>
            ))}

            {loading && (
              <div className="ai-assistant__message ai-assistant__message--assistant">
                <span className="ai-assistant__message-role">Assistant</span>
                <p>Thinking through your request...</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="ai-assistant__composer" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask for ideas, outlines, summaries, or draft improvements..."
              rows="3"
            />

            <div className="ai-assistant__composer-actions">
              <button
                type="button"
                className="button-secondary ai-assistant__composer-voice"
                onClick={handleToggleListening}
                disabled={loading}
              >
                <HiOutlineMicrophone />
                Voice prompt
              </button>

              <button type="submit" className="button-primary" disabled={loading}>
                <HiOutlinePaperAirplane />
                Send
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          type="button"
          className="ai-assistant__trigger"
          onClick={() => setOpen(true)}
        >
          <HiOutlineSparkles />
          Ask AI
        </button>
      )}
    </div>
  );
}

export default AIAssistant;
