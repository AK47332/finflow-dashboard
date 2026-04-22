import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export function NewsletterStrip() {
  const [email, setEmail] = useState("");
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Please enter a valid email");
    toast.success("You're on the list! Check your inbox.");
    setEmail("");
  };
  return (
    <section className="border-y border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto grid items-center gap-6 px-4 py-12 md:grid-cols-2 md:py-16">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-foreground/5 px-3 py-1 text-xs font-semibold">
            <Mail className="h-3 w-3" /> Newsletter
          </div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Get 10% off your first order
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Drops, restocks, and member-only deals — straight to your inbox.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full gap-2 md:justify-end">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="h-12 max-w-sm bg-background"
          />
          <Button type="submit" size="lg" className="h-12">
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  );
}
