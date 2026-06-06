import { useActionData, useNavigation, Form, useSearchParams, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/reset-pin";
import { setAdminPin } from "../../services/admin.server";
import { createSupabaseServerClient } from "../../lib/supabase.server";
import { useState } from "react";
import styles from "./verify.module.css"; // Reuse verify styles
import { KeyRound, Shield, AlertCircle, CheckCircle } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    throw redirect("/admin/verify?error=invalid_reset_request");
  }

  const supabase = await createSupabaseServerClient(request, new Headers());
  // Using explicit any to bypass potential local type lag
  const { data: profile, error } = await (supabase.from("profiles") as any)
    .select("id, admin_pin_reset_token, admin_pin_reset_expires")
    .eq("email", email)
    .single();

  if (error || !profile || profile.admin_pin_reset_token !== token) {
    throw redirect("/admin/verify?error=invalid_token");
  }

  const expires = new Date(profile.admin_pin_reset_expires);
  if (expires < new Date()) {
    throw redirect("/admin/verify?error=token_expired");
  }

  return { email, userId: profile.id };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const pin = formData.get("pin") as string;
  const userId = formData.get("userId") as string;
  const headers = new Headers();

  try {
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      return { error: "PIN must be 6 digits." };
    }

    await setAdminPin(request, headers, userId, pin);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export default function ResetPin() {
  const { email, userId } = useLoaderData<typeof loader>();
  const actionData = useActionData() as { error?: string; success?: boolean };
  const nav = useNavigation();
  const [pin, setPin] = useState("");
  
  const isSubmitting = nav.state === "submitting";

  const handleChar = (char: string) => {
    if (pin.length < 6) setPin(pin + char);
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  if (actionData?.success) {
    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.iconCircle} style={{ borderColor: "#10b981" }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h1 className={styles.title}>PIN RESET</h1>
            <p className={styles.subtitle}>Your security PIN has been updated successfully.</p>
          </div>
          <button onClick={() => window.location.href = "/admin/verify"} className={styles.submitBtn}>
            PROCEED TO LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <KeyRound className={styles.shieldIcon} />
          </div>
          <h1 className={styles.title}>SET NEW PIN</h1>
          <p className={styles.subtitle}>Setting PIN for <strong>{email}</strong></p>
        </div>

        {actionData?.error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{actionData.error}</span>
          </div>
        )}

        <Form method="post" className={styles.verifyForm}>
          <input type="hidden" name="userId" value={userId} />
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
            {isSubmitting ? "UPDATING..." : "SAVE NEW PIN"}
          </button>
        </Form>
      </div>
    </div>
  );
}
