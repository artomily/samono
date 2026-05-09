import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Star } from "lucide-react";
import { formatDuration, formatNumber } from "@/lib/utils";

interface VideoCardProps {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  rewardPoint?: number;
  completed?: boolean;
}

export function VideoCard({
  id,
  youtubeId,
  title,
  thumbnailUrl,
  durationSeconds,
  viewCount,
  rewardPoint,
  completed = false,
}: VideoCardProps) {
  const displayRewardPoint = rewardPoint ?? 0;

  return (
    <Link href={`/watch/${id}`}>
      <Card className="group overflow-hidden border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card transition-all duration-200 cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-mono text-white">
            {formatDuration(durationSeconds)}
          </div>
          {/* Completed overlay */}
          {completed && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/50">
                Completed
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3">
          {/* Title */}
          <h3 className="text-sm font-medium line-clamp-2 leading-snug mb-2">{title}</h3>

          {/* Stats row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(viewCount)}
            </span>
            <span className="flex items-center gap-1 text-primary font-semibold">
              <Star className="h-3 w-3" />
              {displayRewardPoint.toLocaleString()} pts
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
