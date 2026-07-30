"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function FreeSlotAssign({ onAssign }: { onAssign: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-orange-500 dark:text-orange-400">Free</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onAssign}
              aria-label="Assign task"
              className="text-muted-foreground hover:text-primary shrink-0"
            />
          }
        >
          <PlusIcon />
        </TooltipTrigger>
        <TooltipContent>Assign to this slot</TooltipContent>
      </Tooltip>
    </div>
  );
}
