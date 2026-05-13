import { useEffect, useRef, useState, type FC, type ReactNode } from "react";

interface ParallaxBlockProps {
  /** The illustration source URL (typically /illustration-*.webp in public/). */
  illustration: string;
  /** Alt text. Required, but pass "" for decorative SVGs. */
  illustrationAlt: string;
  /** Side the illustration sits on. */
  side?: "left" | "right";
  /** How far the illustration translates on scroll, in pixels. Default 80. */
  parallaxRange?: number;
  /** The text content beside the illustration. */
  children: ReactNode;
  /** Subtle background tint that the section sits on. */
  tint?: "cream" | "ocean" | "pink" | "none";
}

/**
 * A scroll-reactive section: illustration on one side, copy on the other.
 * Uses IntersectionObserver to enter when visible, then a passive scroll
 * listener to compute a translateY for the illustration. Respects
 * prefers-reduced-motion (falls back to a static layout).
 *
 * Behaviour:
 *   - On enter, the illustration fades + slides in from beyond the edge.
 *   - While in view, scroll position drives a soft translateY (parallax).
 *   - Body text remains fully static — no eye-strain.
 */
const ParallaxBlock: FC<ParallaxBlockProps> = ({
  illustration,
  illustrationAlt,
  side = "left",
  parallaxRange = 80,
  children,
  tint = "none",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [offset, setOffset] = useState(0);

  // Lazy initializer reads the media query once on mount — keeps the value
  // readable during render without violating the "no refs during render" rule.
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Subscribe to changes so the user toggling their OS-level preference
  // takes effect without a reload.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);

    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || !inView) return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight;
        // Progress from -1 (just entered from below) to +1 (just left the top)
        const progress = ((viewportH - rect.top) / (viewportH + rect.height)) * 2 - 1;
        setOffset(progress * parallaxRange);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [inView, parallaxRange, reducedMotion]);

  return (
    <section
      ref={ref}
      className={`parallax-block parallax-block--${side} parallax-block--tint-${tint} ${inView ? "is-in-view" : ""}`}
    >
      <div className="parallax-block__illustration-wrap">
        <img
          src={illustration}
          alt={illustrationAlt}
          aria-hidden={illustrationAlt === "" ? true : undefined}
          className="parallax-block__illustration"
          style={{
            transform: reducedMotion ? undefined : `translateY(${-offset}px)`,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="parallax-block__content">{children}</div>
    </section>
  );
};

export default ParallaxBlock;
