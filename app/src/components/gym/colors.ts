export const GROUP_COLORS = [
  "#56c47a",
  "#c9a227",
  "#e06c5a",
  "#6ea8c9",
  "#a48cc4",
  "#d98e52",
  "#4fb3a8",
  "#e0a7b8",
];

export function groupColor(id: number): string {
  return GROUP_COLORS[id % GROUP_COLORS.length];
}