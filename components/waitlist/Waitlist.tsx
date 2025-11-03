"use client";

import { useState } from "react";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Simulated database of existing emails (replace with actual API call)
  const existingEmails = ["test@example.com", "user@demo.com"];

  const handleSubmit = async () => {
    setError("");

    // Check if email is empty
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check if email already exists in database
    if (existingEmails.includes(email.toLowerCase())) {
      setError("This email is already on our waitlist");
      setIsLoading(false);
      return;
    }

    // Success - Add to waitlist
    setIsSubmitted(true);
    setIsLoading(false);

    setTimeout(() => {
      setEmail("");
      setIsSubmitted(false);
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-medium text-white tracking-tight">
            Start Earning Yield
          </h1>
          <h2 className="text-4xl font-medium text-white tracking-tight">
            While Trading
          </h2>
          <p className="text-neutral-400 text-sm mt-6">
            Stop Leaving Capital Idle. Join the ScaleX Protocol Waitlist.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
              className={`w-full px-4 py-3.5 bg-neutral-900 border rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? "border-red-500 focus:ring-red-500/50"
                  : "border-neutral-800 focus:ring-neutral-700 focus:border-transparent"
              }`}
            />
            {error && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitted || isLoading}
            className={`w-full py-3.5 rounded-lg font-medium transition-all ${
              isSubmitted
                ? "bg-green-600 text-white"
                : isLoading
                ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                : "bg-white text-neutral-950 hover:bg-neutral-100 active:scale-[0.98]"
            }`}
          >
            {isSubmitted ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Joined!
              </span>
            ) : isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Joining...
              </span>
            ) : (
              "Join Waitlist"
            )}
          </button>
        </div>

        {isSubmitted && (
          <div className="text-center text-sm text-green-500 transition-opacity duration-300 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Successfully joined! We'll be in touch soon.
          </div>
        )}

        <p className="text-center text-xs text-neutral-600">
          By joining, you agree to receive updates from ScaleX Protocol
        </p>
      </div>
    </div>
  );
}
