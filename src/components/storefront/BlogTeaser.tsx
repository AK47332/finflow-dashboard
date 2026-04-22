import { ArrowUpRight } from "lucide-react";

const POSTS = [
  {
    img: "https://images.unsplash.com/photo-1594761051556-eba2935b1a8b?w=900&auto=format&fit=crop",
    tag: "Bridal",
    date: "Apr 2, 2024",
    title: "5 timeless lehenga colors that never go out of fashion",
    excerpt: "From classic crimson to modern mint — pieces you'll cherish for decades.",
  },
  {
    img: "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=900&auto=format&fit=crop",
    tag: "Style Guide",
    date: "Mar 22, 2024",
    title: "How to style a bandhgala for a modern wedding",
    excerpt: "Three looks our editors love — from sangeet to reception night.",
  },
  {
    img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&auto=format&fit=crop",
    tag: "Craft",
    date: "Mar 14, 2024",
    title: "Inside our Banaras weaving studio",
    excerpt: "Meet the artisans behind every meter of pure handloom silk we ship.",
  },
];

export function BlogTeaser() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="heading-underline font-serif-display text-3xl font-bold md:text-4xl">
            From the journal
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Stories on craft, style, and tradition.
          </p>
        </div>
        <a
          href="#"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-foreground hover:text-primary md:inline-flex"
        >
          Read all <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {POSTS.map((p) => (
          <a
            key={p.title}
            href="#"
            className="group overflow-hidden rounded-2xl bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              <img
                src={p.img}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 text-[11px]">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-bold uppercase tracking-wider text-primary">
                  {p.tag}
                </span>
                <span className="text-muted-foreground">{p.date}</span>
              </div>
              <h3 className="mt-3 line-clamp-2 font-serif text-lg font-bold leading-snug">
                {p.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
