import { useState, useEffect } from "react";
import { announcements, type Announcement } from "../config/announcements";
import { X } from "lucide-react";

function activeAnnouncements(announcements: Announcement[]): Announcement | null {
  return announcements.find((a) => a.active) ?? null;
}

const STORAGE_KEY_PREFIX = "dismissed_announcement_";

const variantStyles: Record<string, string> = {
  info: "bg-blue-400 border-blue-700 text-white",
  success: "bg-green-400 border-green-700 text-white",
  warning: "bg-yellow-400 border-yellow-700 text-yellow-900",
};

const variantIcons: Record<string, JSX.Element> = {
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5" aria-label="Info">
      <title>Info</title>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" strokeWidth="1.5" strokeLinejoin="round" className="stroke-current" fill="none" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5" aria-label="Success">
      <title>Success</title>
      <path d="M8 15C12.8747 15 15 12.949 15 8C15 12.949 17.1104 15 22 15C17.1104 15 15 17.1104 15 22C15 17.1104 12.8747 15 8 15Z" strokeWidth="1.5" strokeLinejoin="round" className="stroke-current" />
      <path d="M2 6.5C5.13376 6.5 6.5 5.18153 6.5 2C6.5 5.18153 7.85669 6.5 11 6.5C7.85669 6.5 6.5 7.85669 6.5 11C6.5 7.85669 5.13376 6.5 2 6.5Z" strokeWidth="1.5" strokeLinejoin="round" className="stroke-current" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5" aria-label="Warning">
      <title>Warning</title>
      <path d="M12 7v6M12 17h0" strokeWidth="2" strokeLinecap="round" className="stroke-current" />
      <path d="M12 2L2 22h20L12 2z" strokeWidth="1.5" strokeLinejoin="round" className="stroke-current" fill="none" />
    </svg>
  ),
};

export default function AnnouncementBanner() {
  const announcement = activeAnnouncements(announcements);
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    const dismissed = localStorage.getItem(STORAGE_KEY_PREFIX + announcement.id);
    if (!dismissed) {
      setMounted(true);
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setMounted(false), 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  if (!announcement || !mounted) return null;

  const dismiss = () => {
    setFadeOut(true);
    setTimeout(() => {
      setMounted(false);
      localStorage.setItem(STORAGE_KEY_PREFIX + announcement.id, "1");
    }, 500);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
      <div
        className={`flex items-center px-3 py-2 border-2 rounded-full ${
          variantStyles[announcement.variant]
        } ${fadeOut ? "animate-fade-out" : "animate-slide-in"}`}
      >
        {variantIcons[announcement.variant]}
        <span className="text-sm ml-2">{announcement.body}</span>
        <button type="button" onClick={dismiss} className="ml-2 p-0.5 rounded-full hover:opacity-70 transition-opacity" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
