"use client";
import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";
import { Button, Modal } from "./workspace-ui";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const dismissedKey = "life-edit-install-dismissed";
export function InstallAppButton() {
  return <Button secondary onClick={() => window.dispatchEvent(new Event("life-edit:install"))}><Download size={18}/>Install The Life Edit</Button>;
}

export function InstallExperience() {
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [secure, setSecure] = useState(true);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const check = () => { const active = standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone); setInstalled(active); if (active) setOffer(false); return active; };
    setSecure(window.isSecureContext);
    if (!check()) { try { setOffer(!localStorage.getItem(dismissedKey)); } catch { setOffer(true); } }
    const ready = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const finished = () => { setInstalled(true); setOffer(false); setPrompt(null); };
    const show = () => setOpen(true);
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", finished);
    window.addEventListener("life-edit:install", show);
    standalone.addEventListener("change", check);
    return () => { window.removeEventListener("beforeinstallprompt", ready); window.removeEventListener("appinstalled", finished); window.removeEventListener("life-edit:install", show); standalone.removeEventListener("change", check); };
  }, []);
  function dismiss() { setOffer(false); try { localStorage.setItem(dismissedKey, "true"); } catch { /* Dismiss for this visit. */ } }
  async function install() {
    if (!prompt) return;
    setBusy(true); setError("");
    try {
      void navigator.storage?.persist?.().catch(() => false);
      await prompt.prompt();
      const result = await prompt.userChoice;
      setPrompt(null);
      if (result.outcome === "accepted") { dismiss(); setOpen(false); }
    } catch { setError("The install prompt is unavailable. Use your browser's Install App or Add To Home Screen menu."); }
    finally { setBusy(false); }
  }
  return <>{offer && !installed && <aside className="le-install-prompt" aria-label="Install app invitation"><button onClick={() => setOpen(true)}><img src="/icon-192.png" width="32" height="32" alt=""/><span>Install The Life Edit</span><Download size={18}/></button><button className="le-icon" title="Dismiss install invitation" aria-label="Dismiss install invitation" onClick={dismiss}><X size={18}/></button></aside>}
    {open && <Modal title="Install The Life Edit" close={() => setOpen(false)}><div className="le-install-guide"><img src="/icon-192.png" width="72" height="72" alt="The Life Edit app icon"/>{installed ? <p>The Life Edit is running as an installed app.</p> : <>
      {!secure && <p role="status">Open this app at an HTTPS address to install it on your phone. A local-network HTTP preview cannot provide full PWA installation.</p>}
      <section><h3>iPhone or iPad</h3><ol><li><Share size={18}/>Tap Share in Safari.</li><li><PlusSquare size={18}/>Tap Add To Home Screen, then Add. Keep Open as Web App enabled when shown.</li></ol></section>
      <section><h3>Android</h3><ol><li><Download size={18}/>Tap Install App in your browser menu, or use the button below when available.</li></ol>{prompt && <Button disabled={busy} onClick={() => void install()}><Download size={18}/>{busy ? "Opening install prompt..." : "Install App"}</Button>}</section>
      <p className="le-muted">Open the new home-screen icon to launch without browser tabs. Demo records stay in this browser&apos;s local storage; export important data before clearing browser storage or switching devices.</p>
    </>}{error && <p role="alert">{error}</p>}</div></Modal>}
  </>;
}
