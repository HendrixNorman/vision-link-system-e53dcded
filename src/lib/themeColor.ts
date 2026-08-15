export interface ThemeColor {
  hue: number;
  saturation: number;
  accentHue: number;
}

export const DEFAULT_THEME_COLOR: ThemeColor = { hue: 158, saturation: 64, accentHue: 158 };

export const COLOR_PRESETS: { name: string; hue: number; saturation: number; accentHue: number }[] = [
  { name: "Emerald", hue: 158, saturation: 64, accentHue: 158 },
  { name: "Aurora Violet", hue: 268, saturation: 70, accentHue: 300 },
  { name: "Electric Blue", hue: 219, saturation: 78, accentHue: 195 },
  { name: "Cyber Teal", hue: 186, saturation: 72, accentHue: 165 },
  { name: "Sunset Coral", hue: 12, saturation: 74, accentHue: 32 },
  { name: "Royal Indigo", hue: 245, saturation: 66, accentHue: 265 },
  { name: "Golden Amber", hue: 38, saturation: 82, accentHue: 20 },
  { name: "Neon Magenta", hue: 322, saturation: 72, accentHue: 285 },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Writes the admin-chosen brand colour into the design-system CSS variables.
 * Lightness values stay mode-specific so light/dark contrast is preserved.
 */
export function applyThemeColor(color: ThemeColor, mode: "light" | "dark") {
  const root = document.documentElement;
  const h = clamp(Math.round(color.hue), 0, 360);
  const s = clamp(Math.round(color.saturation), 20, 95);
  const a = clamp(Math.round(color.accentHue ?? h), 0, 360);

  const set = (k: string, v: string) => root.style.setProperty(k, v);

  if (mode === "dark") {
    set("--background", `${h} 30% 8%`);
    set("--foreground", `${a} 20% 96%`);
    set("--card", `${h} 28% 11%`);
    set("--card-foreground", `${a} 20% 96%`);
    set("--popover", `${h} 28% 12%`);
    set("--popover-foreground", `${a} 20% 96%`);
    set("--primary", `${h} ${s}% 52%`);
    set("--primary-foreground", `${h} 45% 8%`);
    set("--primary-glow", `${a} ${clamp(s + 12, 30, 95)}% 62%`);
    set("--secondary", `${h} 25% 16%`);
    set("--secondary-foreground", `${a} 20% 96%`);
    set("--muted", `${h} 22% 16%`);
    set("--muted-foreground", `${a} 14% 72%`);
    set("--accent", `${a} 30% 20%`);
    set("--accent-foreground", `${a} 30% 94%`);
    set("--border", `${h} 25% 20%`);
    set("--input", `${h} 25% 20%`);
    set("--ring", `${h} ${s}% 55%`);
    set("--sidebar-background", `${h} 32% 10%`);
    set("--sidebar-foreground", `${a} 20% 92%`);
    set("--sidebar-primary", `${h} ${s}% 52%`);
    set("--sidebar-primary-foreground", `${h} 45% 8%`);
    set("--sidebar-accent", `${h} 28% 18%`);
    set("--sidebar-accent-foreground", `${a} 20% 95%`);
    set("--sidebar-border", `${h} 25% 20%`);
    set("--sidebar-ring", `${h} ${s}% 55%`);
    set("--gradient-hero", `linear-gradient(135deg, hsl(${h} ${clamp(s - 6, 20, 90)}% 18%) 0%, hsl(${a} ${s}% 34%) 100%)`);
    set("--gradient-card", `linear-gradient(180deg, hsl(${h} 28% 12%) 0%, hsl(${h} 30% 9%) 100%)`);
    set("--gradient-cream", `linear-gradient(180deg, hsl(${h} 30% 11%) 0%, hsl(${h} 28% 8%) 100%)`);
    set("--gradient-glass", `linear-gradient(140deg, hsl(${a} 40% 70% / 0.14) 0%, hsl(${h} 40% 40% / 0.06) 100%)`);
    set("--glass-bg", `${h} 30% 12% / 0.55`);
    set("--glass-border", `${a} 40% 80% / 0.14`);
    set("--glass-highlight", `${a} 60% 90% / 0.18`);
    set("--shadow-glow", `0 0 48px hsl(${a} ${s}% 55% / 0.35)`);
    set("--shadow-elegant", `0 18px 48px -18px hsl(${h} 60% 4% / 0.65)`);
  } else {
    set("--background", `${a} 32% 97%`);
    set("--foreground", `${h} 35% 12%`);
    set("--card", `0 0% 100%`);
    set("--card-foreground", `${h} 35% 12%`);
    set("--popover", `0 0% 100%`);
    set("--popover-foreground", `${h} 35% 12%`);
    set("--primary", `${h} ${s}% 34%`);
    set("--primary-foreground", `${a} 45% 98%`);
    set("--primary-glow", `${a} ${clamp(s + 8, 30, 95)}% 48%`);
    set("--secondary", `${a} 30% 93%`);
    set("--secondary-foreground", `${h} 35% 16%`);
    set("--muted", `${a} 24% 92%`);
    set("--muted-foreground", `${h} 14% 40%`);
    set("--accent", `${a} 48% 92%`);
    set("--accent-foreground", `${h} ${s}% 24%`);
    set("--border", `${a} 22% 87%`);
    set("--input", `${a} 22% 89%`);
    set("--ring", `${h} ${s}% 38%`);
    set("--sidebar-background", `${h} 40% 14%`);
    set("--sidebar-foreground", `${a} 30% 94%`);
    set("--sidebar-primary", `${h} ${clamp(s + 6, 30, 95)}% 48%`);
    set("--sidebar-primary-foreground", `${h} 40% 10%`);
    set("--sidebar-accent", `${h} 32% 21%`);
    set("--sidebar-accent-foreground", `${a} 30% 96%`);
    set("--sidebar-border", `${h} 28% 23%`);
    set("--sidebar-ring", `${h} ${s}% 52%`);
    set("--gradient-hero", `linear-gradient(135deg, hsl(${h} ${s}% 24%) 0%, hsl(${a} ${clamp(s + 6, 30, 95)}% 42%) 100%)`);
    set("--gradient-card", `linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(${a} 40% 98%) 100%)`);
    set("--gradient-cream", `linear-gradient(180deg, hsl(${a} 45% 98%) 0%, hsl(${a} 30% 93%) 100%)`);
    set("--gradient-glass", `linear-gradient(140deg, hsl(0 0% 100% / 0.75) 0%, hsl(${a} 50% 96% / 0.35) 100%)`);
    set("--glass-bg", `0 0% 100% / 0.6`);
    set("--glass-border", `${h} 30% 40% / 0.14`);
    set("--glass-highlight", `0 0% 100% / 0.7`);
    set("--shadow-glow", `0 0 48px hsl(${a} ${s}% 55% / 0.28)`);
    set("--shadow-elegant", `0 18px 44px -18px hsl(${h} ${s}% 18% / 0.22)`);
  }
}
