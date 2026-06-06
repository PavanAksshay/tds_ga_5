import type { Route } from "./+types/updates";
import { useLoaderData } from "react-router";
import { getPublishedUpdates } from "~/services/updates.server";
import styles from "./updates.module.css";
import { Bell, Calendar, Megaphone, Terminal } from "lucide-react";
import { RichText } from "~/components/rich-text/rich-text";
import { buildMeta } from "~/lib/seo";

export function meta() {
  return [
    ...buildMeta({
      title: "Updates & Changelog — The Developer Community",
      description: "Stay current with the latest platform updates, feature releases, and announcements from The Developer Community engineering team.",
      path: "/updates",
      keywords: "TDC updates, developer community changelog, platform news, TDC announcements",
    }),
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  const responseHeaders = new Headers();
  const updates = await getPublishedUpdates(request, responseHeaders);
  return Response.json({ updates }, { headers: responseHeaders });
}

export default function UpdatesPage({ loaderData }: Route.ComponentProps) {
  const updates: any[] = (loaderData as any).updates || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CHANGELOG": return <Terminal className={styles.typeIcon} />;
      case "NEWS": return <Megaphone className={styles.typeIcon} />;
      case "ANNOUNCEMENT": return <Bell className={styles.typeIcon} />;
      default: return <Calendar className={styles.typeIcon} />;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "CHANGELOG": return styles.badgeChangelog;
      case "NEWS": return styles.badgeNews;
      case "ANNOUNCEMENT": return styles.badgeAnnouncement;
      default: return styles.badgeUpdate; // UPDATE type
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Updates & Changelog</h1>
        <p className={styles.subtitle}>
          Stay up-to-date with what's new in The Developer Community.
        </p>
      </header>

      <div className={styles.feed}>
        {updates.length === 0 ? (
          <div className={styles.emptyState}>
            No updates published yet. Check back soon!
          </div>
        ) : (
          updates.map((update: any) => (
            <article key={update.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardMeta}>
                  <span className={`${styles.badge} ${getBadgeClass(update.type)}`}>
                    {getTypeIcon(update.type)}
                    {update.type}
                  </span>
                  <span className={styles.date}>
                    {new Date(update.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <h2 className={styles.cardTitle}>
                  <RichText text={update.title} />
                </h2>
              </div>
              
              <div className={styles.cardContent}>
                {update.content.split('\n').map((paragraph: string, index: number) => (
                  <p key={index}><RichText text={paragraph} /></p>
                ))}
              </div>
              
              <div className={styles.cardFooter}>
                Published by {update.profiles?.display_name ? (
                  <>
                    <span className={styles.bold}>{update.profiles.display_name}</span>{" - TDC "}
                    <span className={styles.role}>({update.profiles.role || "Team"})</span>
                  </>
                ) : (
                  <strong className={styles.bold}>TDC Admin</strong>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
