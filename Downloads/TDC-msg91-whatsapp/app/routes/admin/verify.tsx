import { useActionData, useNavigation, Form, useSearchParams, redirect, Link } from "react-router";
import type { Route } from "./+types/verify";
import { verifyAndStartAdminSession, requestPinReset, checkAdminSetupStatus, setAdminPin } from "../../services/admin.server";
import { useState, useEffect, useRef } from "react";
import styles from "./verify.module.css";
import { Shield, KeyRound, Mail, AlertCircle, ArrowRight, Lock } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  const setupStatus = await checkAdminSetupStatus(request, headers);
  return { ...setupStatus };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const headers = new Headers();

  try {
    if (intent === "verify") {
      const pin = formData.get("pin") as string;
      const result = await verifyAndStartAdminSession(request, headers, pin);
      
      if (result.needsSetup) {
        return { needsSetup: true, tempPin: pin };
      }

      const url = new URL(request.url);
      const redirectTo = url.searchParams.get("redirect") || "/admin";
      return redirect(redirectTo, { headers });
    }

    if (intent === "setup_pin") {
      const pin = formData.get("pin") as string;
      
      // Get user ID from session
      const { getSessionUser } = await import("../../lib/supabase.server");
      const sessionUser = await getSessionUser(request, headers);
      if (!sessionUser) throw new Error("Unauthorized");

      await setAdminPin(request, headers, sessionUser.id, pin);
      await verifyAndStartAdminSession(request, headers, pin);
      
      const url = new URL(request.url);
      const redirectTo = url.searchParams.get("redirect") || "/admin";
      return redirect(redirectTo, { headers });
    }

    if (intent === "request_reset") {
      const email = formData.get("email") as string;
      await requestPinReset(request, headers, email);
      return { success: true, message: "Reset link sent to your Gmail." };
    }
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return { error: err.message };
  }
}

export default function AdminVerify({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData() as { error?: string; success?: boolean; message?: string; needsSetup?: boolean };
  const nav = useNavigation();
  const [pin, setPin] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const pinValueRef = useRef(pin);

  // Keep the ref updated with the latest state
  useEffect(() => {
    pinValueRef.current = pin;
  }, [pin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgot) return;
      
      // Only handle keys if we're not inside an input (like the email reset)
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" && target.getAttribute("type") !== "hidden") {
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        if (pinValueRef.current.length < 6) {
          setPin(p => p + e.key);
        }
      } else if (e.key === "Backspace") {
        setPin(p => p.slice(0, -1));
      } else if (e.key === "Escape") {
        setPin("");
      } else if (e.key === "Enter") {
        if (pinValueRef.current.length === 6) {
          const form = document.querySelector("form");
          form?.requestSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForgot]); 

  const isSetupMode = !loaderData.hasPin || actionData?.needsSetup;
  const isSubmitting = nav.state === "submitting";

  const handleChar = (char: string) => {
    if (pin.length < 6) setPin(p => p + char);
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            {isSetupMode ? <Lock className={styles.shieldIcon} /> : <Shield className={styles.shieldIcon} />}
          </div>
          <h1 className={styles.title}>{isSetupMode ? "SECURITY INITIALIZATION" : "ADMIN GATEKEEPER"}</h1>
          <p className={styles.subtitle}>
            {showForgot
              ? "Enter your email for a reset link"
              : isSetupMode
                ? "Create your unique 6-digit security PIN — required for admin access"
                : "Please verify your 6-digit security PIN"}
          </p>
        </div>

        {actionData?.error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{actionData.error}</span>
          </div>
        )}

        {actionData?.success && (
          <div className={styles.successBox}>
            <Mail size={18} />
            <span>{actionData.message}</span>
          </div>
        )}

        {!showForgot ? (
          <Form method="post" className={styles.verifyForm}>
            <input type="hidden" name="intent" value={isSetupMode ? "setup_pin" : "verify"} />
            <input type="hidden" name="pin" value={pin} />

            <div className={styles.pinDisplay}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${styles.pinSlot} ${pin.length > i ? styles.filled : ""}`}>
                  {pin.length > i ? "•" : ""}
                </div>
              ))}
            </div>

            <div className={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button key={n} type="button" onClick={() => handleChar(n.toString())} className={styles.key}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => setPin("")} className={styles.keyAction}>C</button>
              <button type="button" onClick={() => handleChar("0")} className={styles.key}>0</button>
              <button type="button" onClick={handleBackspace} className={styles.keyAction}>⌫</button>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={pin.length !== 6 || isSubmitting}>
              {isSubmitting 
                ? "ESTABLISHING SECURE SESSION..." 
                : isSetupMode 
                  ? "ACTIVATE SECURITY" 
                  : "INITIALIZE ENTRY"}
              <ArrowRight size={18} />
            </button>

            <div className={styles.verifyActions}>
              {!isSetupMode && (
                <button type="button" onClick={() => setShowForgot(true)} className={styles.forgotLink}>
                  Forgot PIN?
                </button>
              )}
              <Link to="/" className={styles.backToSite}>
                Return to Site
              </Link>
            </div>
          </Form>
        ) : (
          <Form method="post" className={styles.resetForm}>
            <input type="hidden" name="intent" value="request_reset" />
            <div className={styles.inputGroup}>
              <Mail className={styles.inputIcon} size={20} />
              <input type="email" name="email" placeholder="Admin Email" className={styles.emailInput} required />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "SENDING..." : "SEND RESET LINK"}
            </button>
            <button type="button" onClick={() => setShowForgot(false)} className={styles.backLink}>
              Back to Entry
            </button>
          </Form>
        )}
      </div>
      
      <div className={styles.footer}>
        <span className={styles.copyright}>© 2026 THE DEVELOPER COMMUNITY</span>
        <span className={styles.version}>v3.0.0-SECURE</span>
      </div>
    </div>
  );
}
