"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabaseClient";

export default function AutoLogout() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timeoutId;

    const logout = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.signOut();
        router.push("/");
      }
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 30 minutes in milliseconds
      timeoutId = setTimeout(logout, 30 * 60 * 1000);
    };

    // Events that indicate user activity
    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router]);

  return null;
}
