import { useState, useEffect, useRef } from "react";
import { Check, MessageCircle, ShieldCheck } from "lucide-react";
import { usePhoneVerification } from "../../hooks/use-phone-verification";
import styles from "./phone-verify.module.css";

interface PhoneVerifyProps {
  /** Whether the user's phone is already verified (from the server). */
  initialVerified?: boolean;
  /** Pre-fill the phone number (e.g. an unverified number on file). */
  initialPhone?: string | null;
  /** Notifies the parent whenever verified state changes (used to gate "next"). */
  onVerifiedChange?: (verified: boolean) => void;
}

/**
 * Self-contained WhatsApp phone verification widget.
 * Drives the OTP flow through the usePhoneVerification hook and reports the
 * verified state upward so parents (onboarding / profile) can react.
 */
const COUNTRIES = [
  { code: "+91", flag: "in", label: "+91 (IN)" },
  { code: "+1", flag: "us", label: "+1 (US)" },
  { code: "+44", flag: "gb", label: "+44 (GB)" },
  { code: "+61", flag: "au", label: "+61 (AU)" },
  { code: "+65", flag: "sg", label: "+65 (SG)" },
  { code: "+971", flag: "ae", label: "+971 (AE)" },
  { code: "+49", flag: "de", label: "+49 (DE)" },
  { code: "+33", flag: "fr", label: "+33 (FR)" },
  { code: "+81", flag: "jp", label: "+81 (JP)" },
  { code: "+82", flag: "kr", label: "+82 (KR)" },
];

const getCountryIso = (code: string): string => {
  const map: Record<string, string> = {
    "+91": "in",
    "+1": "us",
    "+44": "gb",
    "+61": "au",
    "+65": "sg",
    "+971": "ae",
    "+49": "de",
    "+33": "fr",
    "+81": "jp",
    "+82": "kr",
  };
  return map[code] || "un";
};

export function PhoneVerify({ initialVerified, initialPhone, onVerifiedChange }: PhoneVerifyProps) {
  const {
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
  } = usePhoneVerification({ initialVerified, initialPhone });

  const lastAttemptedCodeRef = useRef("");

  // Helper to split a full E.164 phone number into country code + local number
  const getInitialCountryAndLocal = (fullPhone: string | null | undefined) => {
    if (!fullPhone) return { country: "+91", local: "" };
    const clean = fullPhone.replace(/\s+/g, "");
    
    for (const c of COUNTRIES) {
      if (clean.startsWith(c.code)) {
        return { country: c.code, local: clean.substring(c.code.length) };
      }
    }
    
    const match = clean.match(/^(\+\d{1,4})/);
    if (match) {
      const parsedCode = match[1];
      return { country: parsedCode, local: clean.substring(parsedCode.length) };
    }
    
    return { country: "+91", local: clean };
  };

  const initialParsed = getInitialCountryAndLocal(initialPhone);
  const [selectedCountry, setSelectedCountry] = useState(initialParsed.country);
  const [localPhone, setLocalPhone] = useState(initialParsed.local);
  const [countriesList, setCountriesList] = useState(COUNTRIES);

  // Sync state to internal phone-verification hook whenever components change
  useEffect(() => {
    const cleanedLocal = localPhone.replace(/[^\d]/g, "");
    setPhone(`${selectedCountry}${cleanedLocal}`);
  }, [selectedCountry, localPhone, setPhone]);

  // Sync state on prop initialPhone changes
  useEffect(() => {
    const parsed = getInitialCountryAndLocal(initialPhone);
    setSelectedCountry(parsed.country);
    setLocalPhone(parsed.local);
    
    const exists = COUNTRIES.some(c => c.code === parsed.country);
    if (!exists && parsed.country.startsWith("+")) {
      setCountriesList([
        ...COUNTRIES,
        { code: parsed.country, flag: "un", label: `${parsed.country} (Other)` }
      ]);
    } else {
      setCountriesList(COUNTRIES);
    }
  }, [initialPhone]);

  useEffect(() => {
    onVerifiedChange?.(verified);
  }, [verified, onVerifiedChange]);

  // Auto-verify OTP when the 6th digit is entered
  useEffect(() => {
    if (code.length === 6 && !verifying && code !== lastAttemptedCodeRef.current) {
      lastAttemptedCodeRef.current = code;
      verifyOtp();
    } else if (code.length !== 6) {
      lastAttemptedCodeRef.current = "";
    }
  }, [code, verifying, verifyOtp]);

  if (phase === "verified") {
    return (
      <div className={styles.verifiedBox}>
        <span className={styles.verifiedIcon}>
          <ShieldCheck size={16} />
        </span>
        <div className={styles.verifiedText}>
          <span className={styles.verifiedLabel}>PHONE_VERIFIED</span>
          <span className={styles.verifiedNumber}>{phone}</span>
        </div>
        <button type="button" className={styles.linkBtn} onClick={editNumber}>
          CHANGE
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {phase === "entry" && (
        <>
          <label className={styles.label}>WHATSAPP_NUMBER</label>
          <div className={styles.inputRow}>
            <div className={styles.countrySelectWrapper}>
              <img
                src={`https://flagcdn.com/w20/${getCountryIso(selectedCountry)}.png`}
                alt=""
                className={styles.flagIcon}
              />
              <select
                className={styles.countrySelect}
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {countriesList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="tel"
              inputMode="tel"
              className={styles.input}
              placeholder="98765 43210"
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value.replace(/[^\d]/g, ""))}
              autoComplete="tel"
            />
            <button
              type="button"
              className={styles.actionBtn}
              onClick={sendOtp}
              disabled={sending || cooldown > 0 || localPhone.trim().length < 6}
            >
              <MessageCircle size={13} />
              {sending ? "SENDING..." : cooldown > 0 ? `RESEND_${cooldown}s` : "SEND_OTP"}
            </button>
          </div>
          <span className={styles.hint}>Choose country code and enter your WhatsApp number (without code).</span>
        </>
      )}

      {phase === "code" && (
        <>
          <label className={styles.label}>ENTER_OTP</label>
          <div className={styles.inputRow}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={styles.codeInput}
              placeholder="------"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
              autoComplete="one-time-code"
            />
            <button
              type="button"
              className={styles.actionBtn}
              onClick={verifyOtp}
              disabled={verifying || code.trim().length !== 6}
            >
              <Check size={13} />
              {verifying ? "VERIFYING..." : "VERIFY"}
            </button>
          </div>
          <div className={styles.codeMeta}>
            <span className={styles.hint}>Sent to {phone}</span>
            <span className={styles.codeMetaActions}>
              <button type="button" className={styles.linkBtn} onClick={editNumber}>
                EDIT_NUMBER
              </button>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={sendOtp}
                disabled={sending || cooldown > 0}
              >
                {cooldown > 0 ? `RESEND_${cooldown}s` : "RESEND"}
              </button>
            </span>
          </div>
        </>
      )}

      {error && <div className={styles.error}>{error}</div>}
      {info && !error && <div className={styles.info}>{info}</div>}
    </div>
  );
}
