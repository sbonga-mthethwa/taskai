/**
 * Deterministic avatar color generation based on a user identifier.
 * Produces a unique hue for each user so fallback avatars look distinct.
 */

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const PALETTE = [
  { bg: "hsl(210, 60%, 92%)", fg: "hsl(210, 70%, 40%)" },
  { bg: "hsl(340, 55%, 90%)", fg: "hsl(340, 60%, 38%)" },
  { bg: "hsl(160, 50%, 90%)", fg: "hsl(160, 60%, 32%)" },
  { bg: "hsl(30, 65%, 90%)",  fg: "hsl(30, 70%, 35%)" },
  { bg: "hsl(270, 50%, 92%)", fg: "hsl(270, 55%, 40%)" },
  { bg: "hsl(190, 55%, 90%)", fg: "hsl(190, 65%, 32%)" },
  { bg: "hsl(50, 60%, 90%)",  fg: "hsl(50, 70%, 30%)" },
  { bg: "hsl(0, 55%, 92%)",   fg: "hsl(0, 60%, 38%)" },
  { bg: "hsl(120, 40%, 90%)", fg: "hsl(120, 50%, 30%)" },
  { bg: "hsl(240, 45%, 92%)", fg: "hsl(240, 55%, 40%)" },
  { bg: "hsl(80, 45%, 90%)",  fg: "hsl(80, 55%, 30%)" },
  { bg: "hsl(300, 40%, 92%)", fg: "hsl(300, 50%, 38%)" },
];

export function getDeterministicColor(seed?: string): { bg: string; fg: string } {
  if (!seed) return PALETTE[0];
  const idx = hashString(seed) % PALETTE.length;
  return PALETTE[idx];
}

export function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}
