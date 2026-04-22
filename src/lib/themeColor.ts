/**
 * Convert "#RRGGBB" or "rgb(r,g,b)" to Tailwind/CSS-variable HSL string "h s% l%".
 * Returns null if input is empty/invalid.
 */
export function colorToHslVar(input?: string | null): string | null {
  if (!input) return null;
  const v = input.trim();
  if (!v) return null;
  let r = 0, g = 0, b = 0;
  if (v.startsWith("#")) {
    const hex = v.replace("#", "");
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return null;
    }
  } else if (v.startsWith("rgb")) {
    const m = v.match(/\d+/g);
    if (!m || m.length < 3) return null;
    r = parseInt(m[0]); g = parseInt(m[1]); b = parseInt(m[2]);
  } else {
    return null;
  }
  // Normalize 0–1
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

/** Build inline CSS variable styles from primary/accent colors. */
export function buildThemeStyle(
  primary?: string | null,
  accent?: string | null,
): React.CSSProperties {
  const style: Record<string, string> = {};
  const p = colorToHslVar(primary);
  const a = colorToHslVar(accent);
  if (p) {
    style["--primary"] = p;
    style["--ring"] = p;
    style["--primary-deep"] = p;
    style["--gradient-primary"] = `linear-gradient(135deg, hsl(${p}), hsl(${p} / 0.85))`;
  }
  if (a) {
    style["--gold"] = a;
    style["--accent-foreground"] = a;
  }
  return style as React.CSSProperties;
}