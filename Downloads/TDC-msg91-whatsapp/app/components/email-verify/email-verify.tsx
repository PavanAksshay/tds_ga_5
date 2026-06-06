import { useState, useEffect, useRef } from "react";
import { Check, Mail, ShieldCheck } from "lucide-react";
import { useEmailVerification } from "../../hooks/use-email-verification";
import styles from "./email-verify.module.css";

interface EmailVerifyProps {
  /** Whether the user's email is already verified (from the server). */
  initialVerified?: boolean;
  /** Pre-fill the email address (e.g. an unverified address on file). */
  initialEmail?: string | null;
  /** When true, the email field is locked (used when the account email is fixed). */
  lockEmail?: boolean;
  /** Notifies the parent whenever verified state changes (used to gate "next"). */
  onVerifiedChange?: (verified: boolean) => void;
}

/**
 * Self-contained email verification widget.
 * Drives the OTP flow through the useEmailVerification hook and reports the
 * verified state upward so parents (onboarding / profile) can react.
 *
 * The OTP is generated and verified server-side; MSG91 only delivers the email.
 */
export function EmailVerify({ initialVerified, initialEmail, lockEmail, onVerifiedChange }: EmailVerifyProps) {
  const {
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
  } = useEmailVerification({ initialVerified, initialEmail });

  const lastAttemptedCodeRef = useRef("");

  // Keep the hook's email in sync if the initial prop changes.
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail, setEmail]);

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
          <span className={styles.verifiedLabel}>EMAIL_VERIFIED</span>
          <span className={styles.verifiedValue}>{email}</span>
        </div>
        <button type="button" className={styles.linkBtn} onClick={editEmail}>
          CHANGE
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {phase === "entry" && (
        <>
          <label className={styles.label}>EMAIL_ADDRESS</label>
          <div className={styles.inputRow}>
            <input
              type="email"
              inputMode="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              readOnly={lockEmail}
            />
            <button
              type="button"
              className={styles.actionBtn}
              onClick={sendOtp}
              disabled={sending || cooldown > 0 || email.trim().length < 5}
            >
              <Mail size={13} />
              {sending ? "SENDING..." : cooldown > 0 ? `RESEND_${cooldown}s` : "SEND_OTP"}
            </button>
          </div>
          <span className={styles.hint}>We'll email a 6-digit code to confirm this address.</span>
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
            <span className={styles.hint}>Sent to {email}</span>
            <span className={styles.codeMetaActions}>
              <button type="button" className={styles.linkBtn} onClick={editEmail}>
                EDIT_EMAIL
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
