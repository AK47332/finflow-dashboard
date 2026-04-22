import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, ChevronRight, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { EcomPage } from "@/lib/ecom";

export function StorefrontPage({ orgId }: { orgId: string }) {
  const { slug } = useParams();
  const [page, setPage] = useState<EcomPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (supabase as any)
      .from("ecom_pages")
      .select("*")
      .eq("organization_id", orgId)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }: any) => {
        setPage(data as EcomPage | null);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      });
  }, [orgId, slug]);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }
  if (!page) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <Home className="h-4 w-4" /> Back home
        </Link>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-10 md:py-16">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{page.title}</span>
      </nav>
      <h1 className="font-serif-display text-3xl font-bold tracking-tight md:text-5xl">{page.title}</h1>
      <div
        className="prose prose-neutral mt-8 max-w-3xl text-foreground/85 prose-headings:font-serif-display prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: page.content || "" }}
      />
    </article>
  );
}