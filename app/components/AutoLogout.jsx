"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabaseClient";
import {
  setPresenceOffline,
  touchLastSeen,
} from "../actions/presenceActions";

export default function AutoLogout() {
  const router = useRouter();

  const [deactivatedModal, setDeactivatedModal] = useState(false);
  const [deactivatedCountdown, setDeactivatedCountdown] = useState(5);
  const deactivationHandledRef = useRef(false);
  // Tracks whether the account was deactivated when we first saw it.
  // Modal should only show on a *transition* to DEACTIVATED while user is logged in.
  const lastDeactivatedStateRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();

    let countdownIntervalId;
    let refreshIntervalId;

    const signOutAndRedirect = async () => {
      try {
        await setPresenceOffline();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      window.location.replace("/");
    };

    const startDeactivationLogout = () => {
      if (deactivationHandledRef.current) return;
      deactivationHandledRef.current = true;

      setDeactivatedModal(true);
      setDeactivatedCountdown(5);

      // Tick the countdown every second.
      countdownIntervalId = setInterval(() => {
        setDeactivatedCountdown((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(countdownIntervalId);
            signOutAndRedirect();
          }
          return Math.max(0, next);
        });
      }, 1000);
    };

    const checkAccountStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      const statusNorm = String(profile?.status || "")
        .trim()
        .toUpperCase();

      // Presence heartbeat: mark this user as "recently active".
      // Admin will treat them as online if `last_seen_at` is within the window.
      // Uses server action (service role) to bypass potential RLS restrictions.
      await touchLastSeen();

      const isDeactivated = statusNorm === "DEACTIVATED";

      // First observation: initialize state. If they are already deactivated,
      // sign them out without showing the modal.
      if (lastDeactivatedStateRef.current === null) {
        lastDeactivatedStateRef.current = isDeactivated;
        if (isDeactivated) {
          signOutAndRedirect();
        }
        return;
      }

      // Transition: not deactivated -> deactivated.
      if (isDeactivated && !lastDeactivatedStateRef.current) {
        startDeactivationLogout();
      }

      lastDeactivatedStateRef.current = isDeactivated;
    };

    // Initial check + periodic polling.
    checkAccountStatus();
    refreshIntervalId = setInterval(checkAccountStatus, 3000);

    return () => {
      if (countdownIntervalId) clearInterval(countdownIntervalId);
      if (refreshIntervalId) clearInterval(refreshIntervalId);
    };
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    let timeoutId;

    const logout = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          await setPresenceOffline();
        } catch {
          // ignore
        }
        await supabase.auth.signOut();
        window.location.replace("/");
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

  return deactivatedModal ? (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900">
          Account deactivated
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your account was deactivated by an admin. You will be logged out in{" "}
          <span className="font-semibold text-gray-900">
            {deactivatedCountdown}
          </span>{" "}
          seconds.
        </p>
      </div>
    </div>
  ) : null;
}
