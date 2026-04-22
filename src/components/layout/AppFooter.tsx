import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/contexts/OrgContext";
import { useFooterSettings } from "@/hooks/useFooterSettings";

export function AppFooter() {
  const { currentOrgId } = useOrg();
  const { settings } = useFooterSettings(currentOrgId);

  return (
    <footer className="border-t border-border/50 bg-card/40 px-3 py-4 backdrop-blur-sm sm:px-4 md:px-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">{settings.copyright_text}</p>
        <div className="flex items-center gap-3">
          {settings.contact_text && (
            <span className="text-xs text-muted-foreground">{settings.contact_text}</span>
          )}
          {settings.contact_button_label && settings.contact_button_url && (
            <Button asChild size="sm" variant="outline" className="h-8 rounded-lg">
              <a href={settings.contact_button_url} target="_blank" rel="noreferrer">
                <Mail className="h-3.5 w-3.5" />
                {settings.contact_button_label}
              </a>
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}