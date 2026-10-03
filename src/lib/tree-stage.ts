export type TreeStage = "seed" | "sprout" | "sapling" | "young" | "established";

export function treeStageFromPlantingDate(
  start: Date,
  now = new Date()
): TreeStage {
  if (start > now) {
    return "seed";
  }

  const yearsDiff = now.getFullYear() - start.getFullYear();
  const monthsDiff = now.getMonth() - start.getMonth();
  const dayAdjustment = now.getDate() < start.getDate() ? -1 : 0;
  const totalMonths = yearsDiff * 12 + monthsDiff + dayAdjustment;

  if (totalMonths < 3) return "seed";
  if (totalMonths < 12) return "sprout";
  if (totalMonths < 24) return "sapling";
  if (totalMonths < 36) return "young";
  return "established";
}
