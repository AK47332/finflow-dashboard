import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Mail, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { EcomNewsletterSubscriber } from "@/lib/ecom";

export default function EcomNewsletterPage() {
  const { currentOrgId } = useOrg();
  const [items, setItems] = useState<EcomNewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!currentOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ecom_newsletter_subscribers")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("created_at", { ascending: false });
    setItems((data as EcomNewsletterSubscriber[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Newsletter — Admin";
    void load();
  }, [currentOrgId]);

  const remove = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    const { error } = await supabase.from("ecom_newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  const exportCsv = () => {
    const header = "Email,Name,Source,Subscribed At,Unsubscribed\n";
    const rows = items
      .map((s) =>
        [s.email, s.full_name ?? "", s.source ?? "", s.created_at, s.is_unsubscribed ? "yes" : "no"]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Newsletter Subscribers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} subscribers</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={items.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No subscribers yet. They'll appear here when visitors sign up from the storefront footer.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Subscribed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{s.source ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
