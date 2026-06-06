import { useState } from "react";
import { Form, useNavigation, useActionData, Link, redirect } from "react-router";
import { CheckCircle2, ArrowLeft, Shield } from "lucide-react";
import type { Route } from "./+types/ideas-submit";
import { requireAuth, requireGithub } from "../services/auth.server";
import { submitProjectIdea } from "../services/ideas.server";
import styles from "./ideas.module.css";

export function meta() {
  return [
    { title: "Submit Your Idea | The Developer Community" },
    { name: "description", content: "Pitch your product idea to The Developer Community. If selected, we help you assemble a team, provide guidance, and support your launch." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  const user = await requireAuth(request, headers);
  await requireGithub(user.id);
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  const user = await requireAuth(request, headers);
  const formData = await request.formData();
  
  const title = (formData.get("title") as string) || "";
  const tagline = (formData.get("tagline") as string) || "";
  const description = (formData.get("description") as string) || "";
  const technicalDetails = (formData.get("technicalDetails") as string) || "";
  const targetAudience = (formData.get("targetAudience") as string) || "";
  const techStackString = (formData.get("techStack") as string) || "";
  
  const teamHelp = formData.get("teamHelp") === "on";
  const productHelp = formData.get("productHelp") === "on";
  const adviceHelp = formData.get("adviceHelp") === "on";
  const tractionHelp = formData.get("tractionHelp") === "on";

  const techStack = techStackString ? techStackString.split(",").map(t => t.trim()) : [];

  try {
    await submitProjectIdea(request, headers, user.id, {
      title,
      tagline,
      description,
      technical_details: technicalDetails,
      target_audience: targetAudience,
      tech_stack: techStack,
      team_help: teamHelp,
      product_help: productHelp,
      advice_help: adviceHelp,
      traction_help: tractionHelp,
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}


export default function IdeasSubmit() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const isSubmitting = navigation.state === "submitting";

  if (actionData?.success) {
    return (
      <div className={styles.container}>
        <div className={styles.successBox}>
          <CheckCircle2 size={64} className={styles.successIcon} />
          <h1 className={styles.successTitle}>Idea Logged Successfully</h1>
          <p className={styles.successText}>
            Your pitch is now in the private queue. Our board of advisors will review the technical feasibility and community impact. 
            Keep an eye on your dashboard for status updates.
          </p>
          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <Link to="/profile" className={styles.submitBtn}>VIEW MY SUBMISSIONS</Link>
            <Link to="/" style={{ color: "var(--color-on-surface-muted)", padding: "var(--space-4)", fontSize: "12px", fontFamily: "var(--family-mono)" }}>BACK TO TERMINAL</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-on-surface-muted)", textDecoration: "none", fontSize: "12px", fontFamily: "var(--family-mono)", marginBottom: "var(--space-8)" }}>
          <ArrowLeft size={14} />
          BACK TO HOME
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          <h1 className={styles.title} style={{ margin: 0 }}>SUBMIT_IDEA</h1>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Shield size={10} color="var(--color-on-surface-muted)" />
            <span style={{ fontSize: "9px", fontFamily: "var(--family-mono)", color: "var(--color-on-surface-muted)", letterSpacing: "0.1em" }}>ENCRYPTED & PRIVATE</span>
          </div>
        </div>
        <p className={styles.description}>
          Have a vision for a product that solves a real technical problem? Pitch it here. 
          If selected, we will help you assemble a team, Provide mentor guidance, and support your launch.
        </p>
      </header>

      <Form method="post" className={styles.form}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>01 // Core Vision</h2>
          <div className={styles.field}>
            <label htmlFor="title">IDEA TITLE</label>
            <input type="text" id="title" name="title" required placeholder="e.g. Decentralized Proof of Compute" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="tagline">ONE-LINER TAGLINE</label>
            <input type="text" id="tagline" name="tagline" required placeholder="A short, catchy description of what it does" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="description">PROBLEM & SOLUTION</label>
            <textarea id="description" name="description" required placeholder="What problem are you solving? How exactly does your idea solve it?" className={styles.textarea} />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>02 // Technical Specs</h2>
          <div className={styles.field}>
            <label htmlFor="technicalDetails">TECHNICAL IMPLEMENTATION (OPTIONAL)</label>
            <textarea id="technicalDetails" name="technicalDetails" placeholder="Architecture, algorithms, or specific technologies you envision using." className={styles.textarea} />
          </div>
          <div className={styles.field}>
            <label htmlFor="techStack">PROPOSED STACK (COMMA SEPARATED)</label>
            <input type="text" id="techStack" name="techStack" placeholder="React, Node.js, Rust, PostgreSQL..." className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="targetAudience">WHO IS THIS FOR?</label>
            <input type="text" id="targetAudience" name="targetAudience" placeholder="e.g. DevOps Engineers, Crypto Traders, College Students" className={styles.input} />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>03 // Support Requirements</h2>
          <p style={{ color: "var(--color-on-surface-muted)", fontSize: "11px", marginBottom: "var(--space-2)" }}>What do you need from the community to ship this?</p>
          <div className={styles.helpGrid}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="teamHelp" />
              <div className={styles.checkboxText}>
                <span className={styles.checkboxTitle}>TEAM BUILDING</span>
                <span className={styles.checkboxSub}>Need developers/designers</span>
              </div>
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="productHelp" />
              <div className={styles.checkboxText}>
                <span className={styles.checkboxTitle}>PRODUCT STRATEGY</span>
                <span className={styles.checkboxSub}>Roadmapping & scope</span>
              </div>
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="adviceHelp" />
              <div className={styles.checkboxText}>
                <span className={styles.checkboxTitle}>TECHNICAL ADVICE</span>
                <span className={styles.checkboxSub}>Expert project review</span>
              </div>
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="tractionHelp" />
              <div className={styles.checkboxText}>
                <span className={styles.checkboxTitle}>TRACTION & SHIPPING</span>
                <span className={styles.checkboxSub}>Go-to-market support</span>
              </div>
            </label>
          </div>
        </div>

        {actionData?.error && (
          <div style={{ color: "#ff5555", fontSize: "12px", fontFamily: "var(--family-mono)", textAlign: "center", background: "rgba(255, 85, 85, 0.1)", padding: "var(--space-4)", border: "1px solid #ff5555" }}>
            ERROR: {actionData.error}
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "ENCRYPTING_AND_SENDING..." : "COMMIT_IDEA_TO_QUEUE"}
        </button>
      </Form>
    </div>
  );
}
