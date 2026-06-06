import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "entry" | "code" | "verified";

interface ApiResult {
  ok?: boolean;
  error?: string;
  phone_number?: string;
}

interface UsePhoneVerificationOptions {
  initialVerified?: boolean;
  initialPhone?: string | null;
}

/**
 * Client-side state machine for MSG91 WhatsApp OTP verification.
 * Talks to /api/phone-send-otp and /api/phone-verify-otp.
 *
 * Key difference from the Meta version: the verify request also sends the
 * phone number, because MSG91's verify API requires it to look up the OTP.
 */
export function usePhoneVerification(opts: UsePhoneVerificationOptions = {}) {
  const [phase, setPhase] = useState<Phase>(opts.initialVerified ? "verified" : "entry");
  const [phone, setPhone] = useState(opts.initialPhone ?? "");
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
      fd.append("phone", phone.trim());
      const res = await fetch("/api/phone-send-otp", { method: "POST", body: fd });
      const data: ApiResult = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setPhase("code");
        setInfo("Code sent via WhatsApp. Enter the 6-digit code below.");
        startCooldown(30);
      } else {
        setError(data.error ?? "Failed to send code. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [phone, sending, cooldown, startCooldown]);

  const verifyOtp = useCallback(async () => {
    if (verifying) return;
    setError(null);
    setInfo(null);
    setVerifying(true);
    try {
      const fd = new FormData();
      fd.append("code", code.trim());
      // MSG91's verify API requires the mobile number to look up the OTP.
      fd.append("phone", phone.trim());
      const res = await fetch("/api/phone-verify-otp", { method: "POST", body: fd });
      const data: ApiResult = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setPhase("verified");
        setInfo("Phone number verified.");
        if (data.phone_number) setPhone(data.phone_number);
      } else {
        setError(data.error ?? "Verification failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }, [code, phone, verifying]);

  /** Return to the number-entry screen (e.g. user wants to change the number). */
  const editNumber = useCallback(() => {
    setPhase("entry");
    setCode("");
    setError(null);
    setInfo(null);
  }, []);

  return {
    phase,
    phone,
    setPhone,
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
    editNumber,
  };
}
