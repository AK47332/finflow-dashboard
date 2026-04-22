import { Heart, Instagram } from "lucide-react";

const IMAGES = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1610189025214-7b4f60a25dab?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1594761051556-eba2935b1a8b?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop",
];

export function InstagramGrid() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <Instagram className="h-3.5 w-3.5" /> @brownfox.couture
        </div>
        <h2 className="heading-underline-center font-serif-display text-3xl font-bold md:text-4xl">
          Follow our story
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-8">
        {IMAGES.map((src, i) => (
          <a
            key={i}
            href="#"
            className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-foreground/0 text-background opacity-0 transition-all duration-300 group-hover:bg-foreground/55 group-hover:opacity-100">
              <Heart className="h-5 w-5 fill-background" />
              <span className="text-[10px] font-bold uppercase tracking-wider">View</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
