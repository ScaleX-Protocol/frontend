"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MeshGradient } from "@paper-design/shaders-react";
import { motion, AnimatePresence } from "motion/react";
import { Check, AlertCircle } from "lucide-react";
import {
  InputButtonProvider,
  InputButtonAction,
  InputButtonInput,
  InputButtonSubmit,
} from "@/components/ui/shadcn-io/input-button";

// Constants
const MESH_GRADIENT_COLORS = ["#1e40af", "#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8"];
const EXISTING_EMAILS = ["test@example.com", "user@demo.com"];

// Social media icons
const DiscordIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (EXISTING_EMAILS.includes(email.toLowerCase())) {
      setError("This email is already on our waitlist");
      setIsLoading(false);
      return;
    }

    setIsSubmitted(true);
    setIsLoading(false);

    setTimeout(() => {
      setEmail("");
      setIsSubmitted(false);
    }, 4000);
  };


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* MeshGradient Background */}
      <div className="absolute inset-0">
        <MeshGradient
          width={dimensions.width}
          height={dimensions.height}
          colors={MESH_GRADIENT_COLORS}
          distortion={0.8}
          swirl={0.6}
          grainMixer={0}
          grainOverlay={0}
          speed={0.42}
          offsetX={0.08}
        />
      </div>

      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-xl"
        >
          {/* Single Unified Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/10" />
            <div className="relative p-8 md:p-10 space-y-8">

              {/* Header Section */}
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center justify-center gap-3"
                >
                  <Image
                    src="/images/logo/ScaleXProtocol.webp"
                    alt="ScaleX Protocol Logo"
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                    priority
                  />
                  <span className="text-xl font-bold text-slate-800">
                    Scale<span className="text-blue-600">X</span> Protocol
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-4"
                >
                  <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                    Start Earning <span className="text-blue-600">Yield</span>
                    <span className="block text-slate-900">
                      While Trading
                    </span>
                  </h1>
                  <p className="text-lg text-slate-700 max-w-md mx-auto leading-relaxed">
                    Stop Leaving Capital Idle.
                    <span className="block">Join the Unified Protocol Waitlist.</span>
                  </p>
                </motion.div>
              </div>

              {/* Form Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="space-y-6"
              >
                <div className="space-y-3">

                  {/* Input Button Component */}
                  <InputButtonProvider>
                    <InputButtonAction>
                      Join to Waitlist
                    </InputButtonAction>

                    <InputButtonInput
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="your@email.com"
                    />

                    <InputButtonSubmit
                      onClick={handleSubmit}
                      disabled={isSubmitted || isLoading}
                      className={
                        isSubmitted
                          ? "bg-green-500 hover:bg-green-600"
                          : isLoading
                            ? "bg-slate-400 cursor-not-allowed"
                            : ""
                      }
                    >
                      {isSubmitted ? "Subscribed!" : isLoading ? "..." : "Subscribe"}
                    </InputButtonSubmit>
                  </InputButtonProvider>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Success Message */}
                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-100 rounded-full border border-green-300">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Successfully subscribed! We&apos;ll be in touch soon.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Social Media Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="pt-6 border-t border-slate-300"
                >
                  <p className="text-center text-sm text-slate-600 mb-4">
                    Join our community
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <motion.a
                      href="#"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg border border-[#5865F2] transition-all duration-200"
                    >
                      <DiscordIcon />
                      <span className="text-sm font-medium">Discord</span>
                    </motion.a>
                    <motion.a
                      href="#"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg border border-slate-800 transition-all duration-200"
                    >
                      <XIcon />
                      <span className="text-sm font-medium">Follow Us</span>
                    </motion.a>
                  </div>
                </motion.div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 pt-4">
                  By joining, you agree to receive updates about ScaleX Protocol.
                  <br />
                  You can unsubscribe anytime.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
