import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote:
      "The craftsmanship on my bridal lehenga was beyond words — every stitch felt intentional. I felt like royalty on my wedding day.",
    name: "Aanya Verma",
    location: "Delhi",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop",
  },
  {
    quote:
      "I've shopped with many ethnic stores, but the fabric quality and finishing here is genuinely a notch above. Worth every rupee.",
    name: "Priya Kapoor",
    location: "Mumbai",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop",
  },
  {
    quote:
      "Got the sherwani delivered for my brother's sangeet — fit perfectly, looked premium, and the gold embroidery is stunning in person.",
    name: "Rohan Mehta",
    location: "Bengaluru",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop",
  },
];

export function TestimonialCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, []);
  const t = TESTIMONIALS[i];

  return (
    <section className="relative overflow-hidden bg-charcoal py-20 text-background md:py-24">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1610189025214-7b4f60a25dab?w=1600&auto=format&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/85 to-charcoal/95" />

      <div className="relative container mx-auto max-w-3xl px-4 text-center">
        <Quote className="mx-auto h-10 w-10 text-gold" />
        <p
          key={t.quote}
          className="mt-6 animate-fade-in font-serif-display text-2xl italic leading-relaxed md:text-3xl"
        >
          "{t.quote}"
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <img
            src={t.avatar}
            alt={t.name}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-gold"
          />
          <div className="font-serif text-base font-semibold">{t.name}</div>
          <div className="text-xs uppercase tracking-wider opacity-70">{t.location}</div>
          <div className="flex gap-0.5">
            {Array.from({ length: t.rating }).map((_, k) => (
              <Star key={k} className="h-4 w-4 fill-gold text-gold" />
            ))}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          {TESTIMONIALS.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={`Testimonial ${k + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === k ? "w-8 bg-gold" : "w-1.5 bg-background/40 hover:bg-background/70",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
