import React from "react";
import classnames from "classnames";
import styles from "./rich-text.module.css";

interface RichTextProps {
  text: string;
  className?: string;
}

export function RichText({ text, className }: RichTextProps) {
  if (!text) return null;

  // Split the string by *...* sequences and <...> sequences, capturing them in the result array
  const parts = text.split(/(\*[^*]+\*|<[^>]+>)/g);

  return (
    <span className={classnames(styles.richText, className)}>
      {parts.map((part, i) => {
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          const innerContent = part.slice(1, -1);
          return (
            <strong key={i} className={styles.highlight}>
              <RichText text={innerContent} />
            </strong>
          );
        }
        if (part.startsWith("<") && part.endsWith(">") && part.length > 2) {
          const innerContent = part.slice(1, -1);
          return (
            <em key={i} className={styles.italic}>
              <RichText text={innerContent} />
            </em>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
