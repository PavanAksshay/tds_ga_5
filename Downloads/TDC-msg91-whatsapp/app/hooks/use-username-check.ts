import { useState, useEffect, useRef } from "react";

/**
 * Hook to check if a username is available in real-time.
 * Returns { available, isChecking, error }
 */
export function useUsernameCheck(username: string) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();
    
    // Reset if too short
    if (cleanUsername.length < 3) {
      setAvailable(null);
      setIsChecking(false);
      setError(null);
      setLastChecked("");
      return;
    }

    // Skip if already checked
    if (cleanUsername === lastChecked) return;

    setIsChecking(true);
    setAvailable(null);
    setError(null);

    // Debounce
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(cleanUsername)}`);
        const result = await res.json();
        
        if (result.error) {
          setError(result.error);
          setAvailable(false);
        } else {
          setAvailable(result.available);
          setLastChecked(cleanUsername);
        }
      } catch (err) {
        console.error("Username check hook error:", err);
        setError("Network error");
        setAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 400); // 400ms debounce as requested

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [username, lastChecked]);

  return { available, isChecking, error };
}
