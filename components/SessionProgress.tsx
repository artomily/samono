"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, EyeOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

interface SessionProgressProps {
  currentTime: number;
  duration: number;
  tabSwitches: number;
  isActive: boolean;
  className?: string;
}

const MAX_TAB_SWITCHES = 5;

export function SessionProgress({
  currentTime,
  duration,
  tabSwitches,
  isActive,
  className,
}: SessionProgressProps) {
  const percentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const tabWarning = tabSwitches >= Math.floor(MAX_TAB_SWITCHES * 0.6);
  const tabDanger = tabSwitches >= MAX_TAB_SWITCHES;

  return (
    <div className={cn("space-y-3 rounded-lg border border-border/50 bg-card/50 p-4", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Watch Progress</span>
        <div className="flex items-center gap-2">
          {/* Active indicator */}
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-xs",
              isActive
                ? "border-green-500/50 bg-green-500/10 text-green-400"
                : "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
            )}
          >
            {isActive ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            {isActive ? "Active" : "Paused"}
          </Badge>

          {/* Tab switch warning */}
          {tabSwitches > 0 && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-xs",
                tabDanger
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : tabWarning
                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                  : "border-border text-muted-foreground"
              )}
            >
              <Zap className="h-3 w-3" />
              {tabSwitches}/{MAX_TAB_SWITCHES} switches
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Progress
        value={percentage}
        className={cn("h-2", tabDanger && "opacity-50")}
      />

      {/* Time row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(Math.floor(currentTime))}
        </span>
        <span>{percentage.toFixed(0)}%</span>
        <span>{formatDuration(duration)}</span>
      </div>

      {/* Warning messages */}
      {tabDanger && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded p-2">
          Too many tab switches. This session may not qualify for rewards.
        </p>
      )}
      {!tabDanger && tabWarning && (
        <p className="text-xs text-yellow-400 bg-yellow-500/10 rounded p-2">
          Warning: Excessive tab switching may disqualify rewards.
        </p>
      )}
    </div>
  );
}
