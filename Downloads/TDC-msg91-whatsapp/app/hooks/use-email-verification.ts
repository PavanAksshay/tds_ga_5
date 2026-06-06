import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "entry" | "code" | "verified";

interface ApiResult {
  ok?: boolean;
  error?: string;
  email?: string;
}

interface UseEmailVerificationOptions {
  initialVerified?: boolean;
  initialEmail?: string | null;
}

/**
 * Client-side state machine for email OTP verification.
 * Talks to /api/email-send-otp and /api/email-verify-otp.
 *
 * Shared by the onboarding email step and the profile settings panel.
 */
export function useEmailVerification(opts: UseEmailVerificationOptions = {}) {
  const [phase, setPhase] = useState<Phase>(opts.initialVerified ? "verified" : "entry");
  const [email, setEmail] = useState(opts.initialEmail ?? "");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const verified = phase === "verified";
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const sendOtp = useCallback(async () => {
    if (sending || cooldown > 0) return;
    setError(null);
    setInfo(null);
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("email", email.trim());
      const res = await fetch("/api/email-send-otp", { method: "POST", body: fd });
      const data: ApiResult = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setPhase("code");
        setInfo("Code sent via email. Enter the 6-digit code below.");
        startCooldown(30);
      } else {
        setError(data.error ?? "Failed to send code. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [email, sending, cooldown, startCooldown]);

  const verifyOtp = useCallback(async () => {
    if (verifying) return;
    setError(null);
    setInfo(null);
    setVerifying(true);
    try {
      const fd = new FormData();
      fd.append("code", code.trim());
      const res = await fetch("/api/email-verify-otp", { method: "POST", body: fd });
      const data: ApiResult = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setPhase("verified");
        setInfo("Email address verified.");
        if (data.email) setEmail(data.email);
      } else {
        setError(data.error ?? "Verification failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }, [code, verifying]);

  /** Return to the email-entry screen (e.g. user wants to change the address). */
  const editEmail = useCallback(() => {
    setPhase("entry");
    setCode("");
    setError(null);
    setInfo(null);
  }, []);

  return {
    phase,
    email,
    setEmail,
    code,
    setCode,
    sending,
    verifying,
    error,
    info,
    cooldown,
    verified,
    sendOtp,
    verifyOtp,
    editEmail,
  };
}
