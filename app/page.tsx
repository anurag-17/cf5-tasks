import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants/app";

// Placeholder landing route — proves the palette/theme wiring renders
// correctly. Replace once the real dashboard routes exist.
export default function Home() {
  return (
    <div className="bg-background text-foreground flex flex-1 flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3">
        <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-sm font-bold">
          T
        </span>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </div>
      <p className="text-muted-foreground text-sm">Project architecture initialized.</p>
      <ThemeToggle />
    </div>
  );
}
