import { useEffect, useState } from "react";
import { MessageCircle, Phone, Mail, X, MessagesSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { EcomContactWidget } from "@/lib/ecom";
import { cn } from "@/lib/utils";

export function ContactWidget({ orgId }: { orgId: string }) {
  const [s, setS] = useState<EcomContactWidget | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (supabase as any)
      .from("ecom_contact_widget")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!cancelled) setS(data as EcomContactWidget | null);
      });
    return () => { cancelled = true; };
  }, [orgId]);

  if (!s || !s.is_enabled) return null;

  const channels: { key: string; label: string; sub: string; href: string; bg: string; icon: any }[] = [];
  if (s.whatsapp_number) {
    const num = s.whatsapp_number.replace(/[^0-9+]/g, "");
    const text = encodeURIComponent(s.whatsapp_message ?? "");
    channels.push({
      key: "wa",
      label: "WhatsApp",
      sub: s.whatsapp_number,
      href: `https://wa.me/${num.replace(/^\+/, "")}?text=${text}`,
      bg: "bg-emerald-500 hover:bg-emerald-600",
      icon: MessageCircle,
    });
  }
  if (s.messenger_username) {
    channels.push({
      key: "fb",
      label: "Messenger",
      sub: `m.me/${s.messenger_username}`,
      href: `https://m.me/${s.messenger_username}`,
      bg: "bg-blue-600 hover:bg-blue-700",
      icon: MessagesSquare,
    });
  }
  if (s.phone_number) {
    channels.push({
      key: "tel",
      label: "Call us",
      sub: s.phone_number,
      href: `tel:${s.phone_number.replace(/[^0-9+]/g, "")}`,
      bg: "bg-violet-600 hover:bg-violet-700",
      icon: Phone,
    });
  }
  if (s.email) {
    channels.push({
      key: "mail",
      label: "Email",
      sub: s.email,
      href: `mailto:${s.email}`,
      bg: "bg-amber-500 hover:bg-amber-600",
      icon: Mail,
    });
  }
  if (channels.length === 0) return null;

  const isLeft = s.position === "bottom-left";

  return (
    <div
      className={cn(
        "fixed bottom-5 z-50 flex flex-col items-end gap-3",
        isLeft ? "left-5 items-start" : "right-5 items-end",
      )}
    >
      {open && (
        <div className="w-[280px] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Contact us</div>
            <div className="mt-0.5 text-sm font-medium leading-snug">{s.greeting ?? "How can we help?"}</div>
          </div>
          <ul className="divide-y divide-border/60 bg-background">
            {channels.map((c) => (
              <li key={c.key}>
                <a
                  href={c.href}
                  target={c.key === "tel" || c.key === "mail" ? undefined : "_blank"}
                  rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm", c.bg)}>
                    <c.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{c.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{c.sub}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close contact" : "Open contact"}
        className={cn(
          "group flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all",
          open
            ? "bg-foreground hover:bg-foreground/90"
            : "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:scale-105",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
        )}
      </button>
    </div>
  );
}