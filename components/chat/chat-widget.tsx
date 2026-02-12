// components/chatbot/chat-widget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BusinessInfo {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  bookingUrl?: string;
  businessHours?: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  services?: { name: string; price: number; duration: number }[];
  faqs?: { question: string; answer: string; keywords: string[] }[];
}

interface ChatWidgetProps {
  business: BusinessInfo;
}

export function ChatWidget({ business }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hi there! 👋 Welcome to ${business.name}. I can help you with:\n\n• Our services and prices\n• Business hours\n• Location and contact info\n• Booking an appointment\n\nHow can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, business.name]);

  // Generate response based on keywords
  const generateResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    // Check custom FAQs first
    if (business.faqs && business.faqs.length > 0) {
      for (const faq of business.faqs) {
        if (faq.keywords && faq.keywords.some((kw) => msg.includes(kw.toLowerCase()))) {
          return faq.answer;
        }
        if (msg.includes(faq.question.toLowerCase().slice(0, 20))) {
          return faq.answer;
        }
      }
    }

    // Greetings
    if (msg.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return `Hello! Welcome to ${business.name}. How can I help you today? You can ask me about our services, prices, hours, or how to book.`;
    }

    // Hours/Schedule
    if (msg.match(/(hour|open|close|when|schedule|time)/)) {
      if (business.businessHours) {
        const hoursText = Object.entries(business.businessHours)
          .map(([day, info]) =>
            info.closed ? `${day}: Closed` : `${day}: ${info.open} - ${info.close}`
          )
          .join("\n");
        return `Our hours are:\n\n${hoursText}\n\nWould you like to book an appointment?`;
      }
      return `Please call us at ${business.phone || "our salon"} for our current hours.`;
    }

    // Services/Prices
    if (msg.match(/(service|price|cost|how much|menu|offer|do you do|treatment)/)) {
      if (business.services && business.services.length > 0) {
        const servicesText = business.services
          .slice(0, 8)
          .map((s) => `• ${s.name}: $${s.price} (${s.duration} min)`)
          .join("\n");
        const moreText = business.services.length > 8 ? "\n\n...and more!" : "";
        return `Here are some of our services:\n\n${servicesText}${moreText}\n\nWould you like to book any of these?`;
      }
      return `We offer a variety of salon services. Please visit our booking page or call us at ${business.phone || "our salon"} for our full menu.`;
    }

    // Specific service inquiries
    if (msg.match(/(haircut|cut|trim)/)) {
      const haircut = business.services?.find((s) =>
        s.name.toLowerCase().includes("haircut") || s.name.toLowerCase().includes("cut")
      );
      if (haircut) {
        return `A ${haircut.name} is $${haircut.price} and takes about ${haircut.duration} minutes. Would you like to book one?`;
      }
      return `We offer haircut services! Please check our booking page for prices and availability.`;
    }

    if (msg.match(/(color|colour|dye|highlight)/)) {
      const color = business.services?.find((s) =>
        s.name.toLowerCase().includes("color") || s.name.toLowerCase().includes("highlight")
      );
      if (color) {
        return `${color.name} starts at $${color.price} (${color.duration} minutes). Color services may vary based on hair length and type. Would you like to book a consultation?`;
      }
      return `We offer color services! Prices vary based on hair length and type. Please book a consultation or call us for a quote.`;
    }

    // Booking
    if (msg.match(/(book|appointment|schedule|reserve|available)/)) {
      const bookingUrl = business.bookingUrl || "#";
      return `You can book an appointment right here on this page! Just select your service, choose a stylist, and pick a time that works for you.\n\nOr call us at ${business.phone || "our salon"} to book by phone.`;
    }

    // Location/Address
    if (msg.match(/(where|location|address|direction|find you|located)/)) {
      if (business.address) {
        return `We're located at:\n\n${business.address}\n\nNeed directions? You can search for "${business.name}" in Google Maps!`;
      }
      return `Please call us at ${business.phone || "our salon"} for our location details.`;
    }

    // Contact
    if (msg.match(/(phone|call|contact|email|reach)/)) {
      let response = "You can reach us at:\n\n";
      if (business.phone) response += `📞 Phone: ${business.phone}\n`;
      if (business.email) response += `✉️ Email: ${business.email}\n`;
      if (business.address) response += `📍 Address: ${business.address}`;
      if (!business.phone && !business.email) {
        response = "Please use the booking page to get in touch with us!";
      }
      return response;
    }

    // Parking
    if (msg.match(/(park|parking)/)) {
      return `Please call us at ${business.phone || "our salon"} for parking information, or check with us when you arrive.`;
    }

    // Cancellation
    if (msg.match(/(cancel|reschedule|change appointment)/)) {
      return `To cancel or reschedule, please call us at ${business.phone || "our salon"} at least 24 hours before your appointment.`;
    }

    // Payment
    if (msg.match(/(pay|payment|card|cash|credit)/)) {
      return `We accept cash and all major credit cards. Payment is due at the time of service.`;
    }

    // Walk-ins
    if (msg.match(/(walk-in|walkin|walk in|without appointment)/)) {
      return `We welcome walk-ins based on availability! However, we recommend booking in advance to guarantee your preferred time.`;
    }

    // Thanks
    if (msg.match(/(thank|thanks|appreciate)/)) {
      return `You're welcome! Is there anything else I can help you with?`;
    }

    // Goodbye
    if (msg.match(/(bye|goodbye|see you|that's all|nothing else)/)) {
      return `Thank you for chatting with us! We look forward to seeing you at ${business.name}. Have a great day! 😊`;
    }

    // Default response
    return `I'm not sure I understand. I can help you with:\n\n• Services and prices\n• Business hours\n• Location and contact info\n• Booking appointments\n\nOr you can call us at ${business.phone || "our salon"} to speak with someone directly.`;
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Generate response after a short delay (feels more natural)
    setTimeout(() => {
      const response = generateResponse(userMessage.content);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal-600 shadow-lg flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
          >
            {/* Header */}
            <div className="bg-teal-600 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{business.name}</h3>
                  <p className="text-xs opacity-80">Online • Ready to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-teal-100">
                      <Bot className="w-4 h-4 text-teal-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-line",
                      message.role === "user"
                        ? "bg-teal-600 text-white"
                        : "bg-white border shadow-sm"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  size="icon"
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">
                Powered by SalonixPro
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
