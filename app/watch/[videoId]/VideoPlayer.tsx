"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { SessionProgress } from "@/components/SessionProgress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Coins, AlertCircle } from "lucide-react";
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

type SessionState = "idle" | "active" | "completed" | "error";

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
        body: JSON.stringify({ video_id: videoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "ALREADY_COMPLETED") {
          setSessionState("completed");
          toast.info("You've already earned rewards for this video");
          return;
        }
        toast.error(data.error ?? "Could not start session");
        setSessionState("error");
        return;
      }
      sessionIdRef.current = data.session_id;
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

    await fetch(`/api/sessions/${sessionIdRef.current}/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_time: ct,
        tab_switches: tabSwitchesRef.current,
        speed_changes: speedChangesRef.current,
        is_active: isPlayingRef.current && isPageVisible,
      }),
    }).catch(() => {});
  }, [sessionState, isPageVisible]);

  // Complete session
  const completeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    const player = playerRef.current;
    const ct = player?.getCurrentTime() ?? durationSeconds;

    try {
      const res = await fetch(`/api/sessions/${sessionIdRef.current}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_time: ct,
          tab_switches: tabSwitchesRef.current,
          speed_changes: speedChangesRef.current,
          active_seconds: activeSecondsRef.current,
          total_seconds: totalSecondsRef.current,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionState("completed");
        setEarnedAmount(data.reward_amount ?? rewardAmount);
        toast.success(`You earned ${data.reward_amount ?? rewardAmount} SMT!`);
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
      {sessionState === "active" && (
        <SessionProgress
          currentTime={currentTime}
          duration={durationSeconds}
          tabSwitches={tabSwitches}
          isActive={isPlayingRef.current && isPageVisible}
        />
      )}

      {/* Completed state */}
      {sessionState === "completed" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold">Reward earned!</p>
                <p className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 mr-1">
                    <Coins className="h-3 w-3 mr-1" />
                    {earnedAmount} SMT
                  </Badge>
                  pending in your wallet
                </p>
              </div>
            </div>
            <Button render={<Link href="/wallet" />} size="sm">
              Claim Now
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
