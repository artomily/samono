"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { SessionProgress } from "@/components/SessionProgress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlaybackRate(): number;
  destroy(): void;
}

interface VideoPlayerProps {
  videoId: string;
  youtubeId: string;
  userId: string;
  durationSeconds: number;
  rewardAmount: number;
}

const HEARTBEAT_INTERVAL_MS = 10_000;
const COMPLETION_THRESHOLD = 0.9; // 90%

type SessionState = "idle" | "active" | "completed" | "already_watched" | "error";

export function VideoPlayer({
  videoId,
  youtubeId,
  userId: _userId,
  durationSeconds,
  rewardAmount,
}: VideoPlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [speedChanges, setSpeedChanges] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [earnedAmount, setEarnedAmount] = useState(0);

  const tabSwitchesRef = useRef(0);
  const speedChangesRef = useRef(0);
  const activeSecondsRef = useRef(0);
  const totalSecondsRef = useRef(0);
  const lastRateRef = useRef(1);
  const isPlayingRef = useRef(false);

  // Start session
  const startSession = useCallback(async () => {
    if (sessionState !== "idle") return;
    try {
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "ALREADY_COMPLETED") {
          setSessionState("already_watched");
          return;
        }
        toast.error(data.error ?? "Could not start session");
        setSessionState("error");
        return;
      }
      sessionIdRef.current = data.data?.sessionId ?? data.session_id;
      setSessionState("active");
    } catch {
      toast.error("Network error starting session");
      setSessionState("error");
    }
  }, [videoId, sessionState]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current || sessionState !== "active") return;
    const player = playerRef.current;
    if (!player) return;

    const ct = player.getCurrentTime();
    setCurrentTime(ct);

    const watchPct = durationSeconds > 0 ? Math.min(ct / durationSeconds, 1) : 0;
    await fetch(`/api/sessions/${sessionIdRef.current}/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activeWatchSeconds: activeSecondsRef.current,
        totalElapsedSeconds: totalSecondsRef.current,
        watchPercentage: watchPct,
        tabSwitchCount: tabSwitchesRef.current,
        pauseCount: 0,
        speedChangeCount: speedChangesRef.current,
      }),
    }).catch(() => {});
  }, [sessionState, isPageVisible, durationSeconds]);

  // Complete session
  const completeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    const player = playerRef.current;
    const ct = player?.getCurrentTime() ?? durationSeconds;

    try {
      const watchPct = durationSeconds > 0 ? Math.min(ct / durationSeconds, 1) : 1;
      const res = await fetch(`/api/sessions/${sessionIdRef.current}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeWatchSeconds: activeSecondsRef.current,
          totalElapsedSeconds: totalSecondsRef.current,
          watchPercentage: watchPct,
          tabSwitchCount: tabSwitchesRef.current,
          pauseCount: 0,
          speedChangeCount: speedChangesRef.current,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionState("completed");
        const pts = data.data?.pointsEarned ?? data.data?.rewardAmount ?? rewardAmount;
        setEarnedAmount(pts);
        toast.success(`You earned ${pts.toLocaleString()} points!`);
      } else {
        setSessionState("error");
        toast.error(data.error ?? "Could not complete session");
      }
    } catch {
      toast.error("Network error completing session");
    }
  }, [durationSeconds, rewardAmount]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!playerContainerRef.current) return;

    const loadApi = () => {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    };

    const initPlayer = () => {
      if (!playerContainerRef.current) return;
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            startSession();
          },
          onStateChange: (e) => {
            const state = e.data;
            const YT = window.YT.PlayerState;

            if (state === YT.PLAYING) {
              isPlayingRef.current = true;

              // Start 1-second progress timer for smooth bar updates
              if (!progressTimerRef.current) {
                progressTimerRef.current = setInterval(() => {
                  const ct = playerRef.current?.getCurrentTime();
                  if (ct !== undefined) setCurrentTime(ct);
                }, 1_000);
              }

              // Detect speed change
              const rate = playerRef.current?.getPlaybackRate() ?? 1;
              if (rate !== lastRateRef.current) {
                speedChangesRef.current += 1;
                setSpeedChanges(speedChangesRef.current);
                lastRateRef.current = rate;
              }

              // Start heartbeat
              if (!heartbeatTimerRef.current) {
                heartbeatTimerRef.current = setInterval(() => {
                  sendHeartbeat();
                  // Track active/total seconds
                  activeSecondsRef.current += HEARTBEAT_INTERVAL_MS / 1000;
                  totalSecondsRef.current += HEARTBEAT_INTERVAL_MS / 1000;
                  setActiveSeconds(activeSecondsRef.current);
                  setTotalSeconds(totalSecondsRef.current);
                }, HEARTBEAT_INTERVAL_MS);
              }
            } else {
              isPlayingRef.current = false;
              if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
                progressTimerRef.current = null;
              }
              if (heartbeatTimerRef.current) {
                clearInterval(heartbeatTimerRef.current);
                heartbeatTimerRef.current = null;
              }

              if (state === YT.ENDED) {
                completeSession();
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      loadApi();
    }

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      playerRef.current?.destroy();
    };
  }, [youtubeId, startSession, sendHeartbeat, completeSession]);

  // Tab visibility tracking
  useEffect(() => {
    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      setIsPageVisible(visible);
      if (!visible) {
        tabSwitchesRef.current += 1;
        setTabSwitches(tabSwitchesRef.current);
        // Track paused time
        totalSecondsRef.current += HEARTBEAT_INTERVAL_MS / 1000;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Completion check by time
  useEffect(() => {
    if (
      sessionState === "active" &&
      durationSeconds > 0 &&
      currentTime >= durationSeconds * COMPLETION_THRESHOLD
    ) {
      completeSession();
    }
  }, [currentTime, durationSeconds, sessionState, completeSession]);

  return (
    <div className="space-y-4">
      {/* YouTube player */}
      <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video">
        <div ref={playerContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Progress tracker */}
      {(sessionState === "active" || sessionState === "idle") && (
        <SessionProgress
          currentTime={currentTime}
          duration={durationSeconds}
          tabSwitches={tabSwitches}
          isActive={isPlayingRef.current && isPageVisible}
        />
      )}

      {/* Already watched banner */}
      {sessionState === "already_watched" && (
        <Card className="border-yellow-500/30 bg-yellow-500/8">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-300">Sudah ditonton</p>
              <p className="text-xs text-yellow-400/80 mt-0.5">
                Kamu sudah menyelesaikan video ini dan mendapatkan poinnya. Kamu masih bisa menontonnya, tapi tidak ada poin tambahan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed state */}
      {sessionState === "completed" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold">Points earned!</p>
                <p className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 mr-1">
                    <Star className="h-3 w-3 mr-1" />
                    {earnedAmount.toLocaleString()} points
                  </Badge>
                  added to your balance
                </p>
              </div>
            </div>
            <Button render={<Link href="/dashboard/swap" />} size="sm">
              Swap to SOL
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {sessionState === "error" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm">
              Session could not be tracked. Rewards may not be credited for this view.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
