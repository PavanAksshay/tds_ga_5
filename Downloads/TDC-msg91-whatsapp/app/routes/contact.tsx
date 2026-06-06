import type { Route } from "./+types/contact";
import { Form, useNavigation } from "react-router";
import { submitContact } from "~/services/contacts.server";
import styles from "./contact.module.css";
import { buildMeta, buildBreadcrumbSchema, SITE_URL } from "~/lib/seo";

export function meta() {
  return [
    ...buildMeta({
      title: "Contact Us — Partnerships, Sponsorships & Support",
      description: "Get in touch with The Developer Community for sponsorships, hiring partnerships, and technical support. We pair organizations with verified production engineers.",
      path: "/contact",
      keywords: "contact TDC, developer community partnership, sponsor developer community, hire engineers, TDC support",
    }),
  ];
}


export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const company_name = formData.get("company_name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!email || !message) {
    return { error: "Email and message are required." };
  }

  const responseHeaders = new Headers();
  try {
    await submitContact(request, responseHeaders, { company_name, email, subject, message, status: "NEW", internal_notes: null });
    return Response.json({ success: true }, { headers: responseHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to submit message." }, { headers: responseHeaders });
  }
}

export default function ContactPage({ actionData }: Route.ComponentProps) {
  const data: any = actionData || {};
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className={styles.root}>
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.breadcrumb}>COMMS_GATEWAY // INBOUND_FEED</div>
        <h1 className={styles.headline}>GET IN TOUCH.</h1>
        <p className={styles.subheadline}>
          Interested in sponsoring TDC, exploring a partnership, or needing technical support? 
          Choose a node or drop us a message.
        </p>
      </header>

      <main className={styles.main}>
        {/* Sidebar Info Cards */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <h3 className={styles.sideCardTitle}>Partnerships</h3>
            <p className={styles.sideCardText}>
              For organizations looking to integrate with our shipping pipelines or hire verified talent.
            </p>
          </div>
          <div className={styles.sideCard}>
            <h3 className={styles.sideCardTitle}>Sponsorship</h3>
            <p className={styles.sideCardText}>
              Support the infrastructure that powers the next generation of production engineers.
            </p>
          </div>
          <div className={styles.sideCard}>
            <h3 className={styles.sideCardTitle}>Direct Node</h3>
            <p className={styles.sideCardText}>
              hello@tdc.community<br />
              @tdc_engineering
            </p>
          </div>
        </aside>

        {/* Central Form Container */}
        <div className={styles.formContainer}>
          {data.success ? (
            <div className={styles.successState}>
              <h2 className={styles.successTitle}>MESSAGE_LOGGED</h2>
              <p className={styles.sideCardText}>
                Your transmission has been received. We will respond via the provided email shortly.
              </p>
            </div>
          ) : (
            <Form method="post" className={styles.form}>
              {data.error && <div className={styles.errorAlert}>{data.error}</div>}
              
              <div className={styles.formGroup}>
                <label htmlFor="company_name" className={styles.label}>Organization (Optional)</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  className={styles.input}
                  placeholder="Acme Corp"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Auth Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className={styles.input}
                  placeholder="name@server.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.label}>Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className={styles.input}
                  placeholder="Inquiry Type"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.label}>Packet Message *</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  className={styles.textarea}
                  placeholder="Encompass your inquiry here..."
                />
              </div>

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? "TRANSMITTING..." : "LOG_MESSAGE →"}
              </button>
            </Form>
          )}
        </div>
      </main>
    </div>
  );
}
