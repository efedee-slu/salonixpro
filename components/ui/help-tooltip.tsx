// components/ui/help-tooltip.tsx
"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  text: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function HelpTooltip({ text, side = "top" }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen} delayDuration={300}>
        <TooltipTrigger
          asChild
          onClick={(e) => {
            e.preventDefault();
            setOpen((prev) => !prev);
          }}
        >
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] font-medium text-gray-400 cursor-help select-none"
            aria-label="Help"
          >
            ?
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[250px] text-xs">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
