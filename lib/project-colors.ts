/** Deterministic pastel chip styles for project labels (light + dark). */
const PROJECT_CHIP_STYLES = [
  "bg-violet-100 text-violet-900 ring-violet-200/80 dark:bg-violet-950/60 dark:text-violet-100 dark:ring-violet-800/60",
  "bg-emerald-100 text-emerald-900 ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-100 dark:ring-emerald-800/60",
  "bg-amber-100 text-amber-950 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-800/60",
  "bg-rose-100 text-rose-900 ring-rose-200/80 dark:bg-rose-950/60 dark:text-rose-100 dark:ring-rose-800/60",
  "bg-sky-100 text-sky-900 ring-sky-200/80 dark:bg-sky-950/60 dark:text-sky-100 dark:ring-sky-800/60",
  "bg-teal-100 text-teal-900 ring-teal-200/80 dark:bg-teal-950/60 dark:text-teal-100 dark:ring-teal-800/60",
  "bg-indigo-100 text-indigo-900 ring-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-100 dark:ring-indigo-800/60",
  "bg-orange-100 text-orange-950 ring-orange-200/80 dark:bg-orange-950/60 dark:text-orange-100 dark:ring-orange-800/60",
] as const;

const PROJECT_DOT_STYLES = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-orange-500",
] as const;

function hashProjectName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function projectChipClass(projectName: string) {
  const index = hashProjectName(projectName) % PROJECT_CHIP_STYLES.length;
  return PROJECT_CHIP_STYLES[index]!;
}

export function projectDotClass(projectName: string) {
  const index = hashProjectName(projectName) % PROJECT_DOT_STYLES.length;
  return PROJECT_DOT_STYLES[index]!;
}
