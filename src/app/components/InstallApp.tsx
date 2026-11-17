"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export default function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const handler = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPromptEvent); setVisible(true); };
    window.addEventListener("beforeinstallprompt", handler);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) setIosHint(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!visible && !iosHint) return null;
  return <div className="install-banner">
    <div className="install-copy"><span className="install-icon"><Download size={16}/></span><span><strong>Install Bikash OS</strong><small>{iosHint && !promptEvent ? "Use Share → Add to Home Screen" : "Add your personal workspace to this phone"}</small></span></div>
    {promptEvent ? <button className="install-button" onClick={async () => { await promptEvent.prompt(); const choice = await promptEvent.userChoice; if (choice.outcome === "accepted") { setVisible(false); setPromptEvent(null); } }}>Install app</button> : null}
    <button className="install-dismiss" aria-label="Dismiss install prompt" onClick={() => { setVisible(false); setIosHint(false); }}><X size={16}/></button>
  </div>;
}
