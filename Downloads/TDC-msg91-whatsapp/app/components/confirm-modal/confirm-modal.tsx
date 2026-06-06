import { useState } from "react";
import styles from "./confirm-modal.module.css";
import { AlertTriangle, X } from "lucide-react";
import classnames from "classnames";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string; // What they need to type (default: 'DELETE')
  dangerLabel?: string; // Text on the button (default: 'HARD DELETE')
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "DELETE",
  dangerLabel = "CONFIRM HARD DELETE"
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue.toUpperCase() === confirmText.toUpperCase()) {
      onConfirm();
      setInputValue("");
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <AlertTriangle className={styles.warningIcon} size={20} />
            <h2 className={styles.title}>{title}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
          
          <div className={styles.verificationBox}>
            <p className={styles.instruction}>
              To proceed, please type <span className={styles.code}>{confirmText}</span> below:
            </p>
            <input
              type="text"
              className={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type ${confirmText}...`}
              autoFocus
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            CANCEL
          </button>
          <button
            className={classnames(
              styles.dangerBtn,
              inputValue.toUpperCase() !== confirmText.toUpperCase() && styles.disabled
            )}
            onClick={handleConfirm}
            disabled={inputValue.toUpperCase() !== confirmText.toUpperCase()}
          >
            {dangerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
