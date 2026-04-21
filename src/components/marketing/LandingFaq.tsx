import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How is data isolated between workspaces?",
    a: "Every record in your workspace is tagged with an organization ID. Database-level row security policies enforce that no member of one workspace can ever read or write data belonging to another — even if there's a bug in our application code.",
  },
  {
    q: "Can I invite my accountant or bookkeeper?",
    a: "Yes. On Pro and Business plans you can invite unlimited team members with role-based access (owner, admin, member). Each invite is sent by email with a secure join link.",
  },
  {
    q: "What payment methods can I collect from my customers?",
    a: "Coming soon: Stripe (cards, Apple Pay, Google Pay), bKash, and Nagad. Each workspace can connect its own merchant account so payments go directly to you.",
  },
  {
    q: "Can I export my data?",
    a: "Always. Every report, ledger, and transaction list can be exported to CSV or PDF. Your data is yours — no lock-in.",
  },
  {
    q: "Do you support multiple currencies?",
    a: "Each workspace has its own primary currency. We support USD, EUR, GBP, INR, BDT, AUD, CAD, JPY, CNY, and more.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Free includes one workspace, two team members, unlimited transactions, notes, and reminders. No credit card required.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">FAQ</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered.
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-5"
            >
              <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-white/60">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
