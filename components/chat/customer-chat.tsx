"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Clock,
  MapPin,
  Phone,
  Scissors,
  DollarSign,
  Calendar,
  ChevronRight,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
  quickReplies?: string[];
}

interface BusinessInfo {
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string[];
  currencySymbol?: string;
  services?: {
    id: string;
    name: string;
    price: number;
    duration: number;
    category?: string;
  }[];
}

interface CustomerChatProps {
  business: BusinessInfo;
}

export function CustomerChat({ business }: CustomerChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          text: `Hi! 👋 Welcome to ${business.name}! I'm here to help you with any questions about our services, prices, or booking appointments. How can I assist you today?`,
          sender: "bot",
          timestamp: new Date(),
          quickReplies: [
            "View Services",
            "Check Prices",
            "Business Hours",
            "Location",
            "Book Appointment",
          ],
        },
      ]);
    }
  }, [business.name, messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const formatWorkingDays = () => {
    const days = business.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (days.length === 7) return "Every day";
    if (days.length === 6 && !days.includes("Sunday")) return "Monday - Saturday";
    if (days.length === 5 && !days.includes("Saturday") && !days.includes("Sunday")) return "Monday - Friday";
    return days.join(", ");
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getServicesByCategory = () => {
    const services = business.services || [];
    const categories: { [key: string]: typeof services } = {};
    
    services.forEach((service) => {
      const cat = service.category || "Other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(service);
    });
    
    return categories;
  };

  const generateResponse = (userMessage: string): { text: string; quickReplies?: string[] } => {
    const msg = userMessage.toLowerCase();
    const currency = business.currencySymbol || "$";

    // Services / What do you offer
    if (msg.includes("service") || msg.includes("offer") || msg.includes("do you do") || msg.includes("what can") || msg.includes("view service")) {
      const categories = getServicesByCategory();
      const categoryNames = Object.keys(categories);
      
      if (categoryNames.length === 0) {
        return {
          text: "We offer a variety of beauty and styling services. Please visit our booking page to see the full menu!",
          quickReplies: ["Check Prices", "Book Appointment", "Business Hours"],
        };
      }

      let response = "Here are our service categories:\n\n";
      categoryNames.forEach((cat) => {
        response += `✨ **${cat}**\n`;
        categories[cat].slice(0, 3).forEach((s) => {
          response += `   • ${s.name} (${s.duration} min)\n`;
        });
        if (categories[cat].length > 3) {
          response += `   • ...and ${categories[cat].length - 3} more\n`;
        }
        response += "\n";
      });

      return {
        text: response + "Would you like to know prices or book an appointment?",
        quickReplies: ["Check Prices", "Book Appointment", "Business Hours"],
      };
    }

    // Prices
    if (msg.includes("price") || msg.includes("cost") || msg.includes("how much") || msg.includes("rate") || msg.includes("fee")) {
      const services = business.services || [];
      
      if (services.length === 0) {
        return {
          text: "Please check our booking page for current pricing!",
          quickReplies: ["View Services", "Book Appointment"],
        };
      }

      // Check if asking about specific service
      const matchedService = services.find((s) => 
        msg.includes(s.name.toLowerCase())
      );

      if (matchedService) {
        return {
          text: `💇 **${matchedService.name}**\n\n💰 Price: ${currency}${matchedService.price.toFixed(2)}\n⏱️ Duration: ${matchedService.duration} minutes\n\nWould you like to book this service?`,
          quickReplies: ["Book Appointment", "View All Prices", "Other Services"],
        };
      }

      let response = "Here are our prices:\n\n";
      const categories = getServicesByCategory();
      
      Object.keys(categories).forEach((cat) => {
        response += `**${cat}**\n`;
        categories[cat].forEach((s) => {
          response += `• ${s.name}: ${currency}${s.price.toFixed(2)} (${s.duration} min)\n`;
        });
        response += "\n";
      });

      return {
        text: response,
        quickReplies: ["Book Appointment", "Business Hours", "Location"],
      };
    }

    // Hours / Opening times
    if (msg.includes("hour") || msg.includes("open") || msg.includes("close") || msg.includes("time") || msg.includes("when")) {
      const openTime = formatTime(business.openingTime) || "9:00 AM";
      const closeTime = formatTime(business.closingTime) || "6:00 PM";
      const days = formatWorkingDays();

      return {
        text: `🕐 **Our Business Hours**\n\n📅 Days: ${days}\n⏰ Hours: ${openTime} - ${closeTime}\n\nWe recommend booking in advance to secure your preferred time slot!`,
        quickReplies: ["Book Appointment", "View Services", "Location"],
      };
    }

    // Location / Address / Where
    if (msg.includes("location") || msg.includes("address") || msg.includes("where") || msg.includes("find you") || msg.includes("direction")) {
      const address = business.address || "Please contact us for our address";
      const city = business.city || "";
      const phone = business.phone || "";

      let response = `📍 **Our Location**\n\n${address}`;
      if (city) response += `\n${city}`;
      if (phone) response += `\n\n📞 Call us: ${phone}`;

      return {
        text: response,
        quickReplies: ["Business Hours", "Book Appointment", "View Services"],
      };
    }

    // Phone / Contact
    if (msg.includes("phone") || msg.includes("call") || msg.includes("contact") || msg.includes("number")) {
      const phone = business.phone || "Contact information not available";

      return {
        text: `📞 **Contact Us**\n\nPhone: ${phone}\n\nYou can also book directly through our online booking system!`,
        quickReplies: ["Book Appointment", "Business Hours", "Location"],
      };
    }

    // Book / Appointment / Schedule
    if (msg.includes("book") || msg.includes("appointment") || msg.includes("schedule") || msg.includes("reserve")) {
      return {
        text: "Great! To book an appointment:\n\n1️⃣ Select your services from the list above\n2️⃣ Choose your preferred stylist\n3️⃣ Pick a date and time\n4️⃣ Enter your contact details\n5️⃣ Confirm your booking!\n\nJust scroll up and start selecting services to begin. 👆",
        quickReplies: ["View Services", "Check Prices", "Business Hours"],
      };
    }

    // Cancel / Reschedule
    if (msg.includes("cancel") || msg.includes("reschedule") || msg.includes("change appointment")) {
      return {
        text: "To cancel or reschedule an appointment, please contact us directly:\n\n📞 " + (business.phone || "Call us") + "\n\nPlease provide at least 24 hours notice for cancellations.",
        quickReplies: ["Book Appointment", "Business Hours", "Location"],
      };
    }

    // Payment / Pay / Deposit
    if (msg.includes("pay") || msg.includes("deposit") || msg.includes("card") || msg.includes("cash")) {
      return {
        text: "💳 **Payment Information**\n\nWe accept:\n• Cash\n• Bank transfer\n\nA deposit may be required to confirm your booking. You'll see the deposit amount and payment details after booking.",
        quickReplies: ["Book Appointment", "View Services", "Contact Us"],
      };
    }

    // Hello / Hi / Hey
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("good morning") || msg.includes("good afternoon")) {
      return {
        text: `Hello! 👋 Welcome to ${business.name}! How can I help you today?`,
        quickReplies: ["View Services", "Check Prices", "Business Hours", "Book Appointment"],
      };
    }

    // Thank you
    if (msg.includes("thank") || msg.includes("thanks")) {
      return {
        text: "You're welcome! 😊 Is there anything else I can help you with?",
        quickReplies: ["View Services", "Book Appointment", "Business Hours"],
      };
    }

    // Help
    if (msg.includes("help") || msg === "?") {
      return {
        text: "I can help you with:\n\n• 💇 View our services\n• 💰 Check prices\n• 🕐 Business hours\n• 📍 Our location\n• 📅 Book an appointment\n\nJust ask me anything or tap one of the buttons below!",
        quickReplies: ["View Services", "Check Prices", "Business Hours", "Location", "Book Appointment"],
      };
    }

    // Specific service queries
    const services = business.services || [];
    for (const service of services) {
      if (msg.includes(service.name.toLowerCase())) {
        return {
          text: `💇 **${service.name}**\n\n💰 Price: ${currency}${service.price.toFixed(2)}\n⏱️ Duration: ${service.duration} minutes\n\nWould you like to book this service?`,
          quickReplies: ["Book Appointment", "View All Services", "Check Other Prices"],
        };
      }
    }

    // Default response
    return {
      text: "I'm not sure I understand. Here are some things I can help with:\n\n• Our services and prices\n• Business hours\n• Location and contact info\n• Booking appointments\n\nPlease try one of the options below or rephrase your question!",
      quickReplies: ["View Services", "Check Prices", "Business Hours", "Location", "Book Appointment"],
    };
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate typing
    setIsTyping(true);
    setTimeout(() => {
      const response = generateResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: "bot",
        timestamp: new Date(),
        quickReplies: response.quickReplies,
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 500 + Math.random() * 500);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const formatMessageText = (text: string) => {
    // Convert **text** to bold
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Chat Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
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
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{business.name}</h3>
                  <p className="text-xs text-teal-100">Online • Ready to help</p>
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
                <div key={message.id}>
                  <div
                    className={cn(
                      "flex gap-2",
                      message.sender === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.sender === "bot" && (
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-teal-600" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                        message.sender === "user"
                          ? "bg-teal-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md shadow-sm border"
                      )}
                    >
                      {formatMessageText(message.text)}
                    </div>
                    {message.sender === "user" && (
                      <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Quick Replies */}
                  {message.sender === "bot" && message.quickReplies && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-10">
                      {message.quickReplies.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => handleQuickReply(reply)}
                          className="text-xs bg-white border border-teal-200 text-teal-700 px-3 py-1.5 rounded-full hover:bg-teal-50 hover:border-teal-300 transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full bg-teal-600 hover:bg-teal-700 w-10 h-10"
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
