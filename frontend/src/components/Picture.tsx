import { useState, type FC, type CSSProperties } from "react";
import { PHOTO_WIDTHS, type PhotoMeta } from "../assets/photos/album1";

interface PictureProps {
  /** A PhotoMeta record from the generated manifest. */
  photo: PhotoMeta;
  /**
   * Alt text. Required — every photo we ship needs one. For decorative photos
   * (rare in this app) pass an empty string and the image gets aria-hidden.
   */
  alt: string;
  /**
   * `sizes` attribute for responsive selection. Defaults to a sensible
   * "full-bleed on mobile, half on tablet, third on desktop" curve. Override
   * for hero or thumb contexts.
   */
  sizes?: string;
  /**
   * Set true for the LCP image (hero). Disables lazy loading and adds
   * fetchpriority=high so the browser starts downloading immediately.
   */
  priority?: boolean;
  /** Object-fit: cover (default) keeps aspect via crop; contain shows full image. */
  fit?: "cover" | "contain";
  /** CSS aspect-ratio override; defaults to the source aspect. */
  aspectRatio?: number;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_SIZES =
  "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw";

function buildSrcSet(srcMap: Record<number, string>): string {
  return PHOTO_WIDTHS
    .filter((w) => srcMap[w])
    .map((w) => `${srcMap[w]} ${w}w`)
    .join(", ");
}

/**
 * Responsive <picture> with AVIF → WebP → JPG fallback chain, blur-up
 * placeholder, and reserved aspect-ratio box (no layout shift).
 *
 * The placeholder is the base64 LQIP from the manifest, rendered as a
 * background-image and crossfaded out when the high-res loads. Combined with
 * the dominant colour we avoid the "grey box" flash entirely.
 */
const Picture: FC<PictureProps> = ({
  photo,
  alt,
  sizes = DEFAULT_SIZES,
  priority = false,
  fit = "cover",
  aspectRatio,
  className = "",
  style,
}) => {
  const [loaded, setLoaded] = useState(false);
  const ratio = aspectRatio ?? photo.aspectRatio;

  // Pick the largest jpg as the <img src> fallback for old browsers / no JS.
  const jpgWidths = Object.keys(photo.src.jpg).map(Number).sort((a, b) => a - b);
  const fallbackSrc = photo.src.jpg[jpgWidths[jpgWidths.length - 1]];
  // Smallest jpg as a reasonable default-src for crawler eyes.
  const smallestJpg = photo.src.jpg[jpgWidths[0]];

  return (
    <div
      className={`hs-picture ${loaded ? "is-loaded" : ""} ${className}`}
      style={{
        aspectRatio: ratio,
        backgroundColor: photo.dominantHex,
        backgroundImage: `url("${photo.lqip}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...style,
      }}
      aria-hidden={alt === "" ? true : undefined}
    >
      <picture>
        <source
          type="image/avif"
          srcSet={buildSrcSet(photo.src.avif)}
          sizes={sizes}
        />
        <source
          type="image/webp"
          srcSet={buildSrcSet(photo.src.webp)}
          sizes={sizes}
        />
        <img
          src={smallestJpg}
          srcSet={buildSrcSet(photo.src.jpg)}
          sizes={sizes}
          alt={alt}
          width={photo.width}
          height={photo.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
          onLoad={() => setLoaded(true)}
          style={{
            objectFit: fit,
            objectPosition: "center",
            opacity: loaded ? 1 : 0,
            transition: "opacity 400ms ease-out",
          }}
          // Fallback if onLoad doesn't fire (cached image)
          onError={() => setLoaded(true)}
          ref={(el) => {
            if (el?.complete) setLoaded(true);
          }}
          // Suppress fallback warning — we accept the largest jpg as the
          // ultimate fallback for noscript/very-old browsers.
          data-fallback-src={fallbackSrc}
        />
      </picture>
    </div>
  );
};

export default Picture;
