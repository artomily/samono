import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/dal/profiles";
import { LevelBadge } from "@/components/LevelBadge";
import { XPProgressBar } from "@/components/XPProgressBar";
import { AchievementCard } from "@/components/AchievementCard";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const data = await getProfileByUsername(username);

  if (!data) notFound();

  const { profile, videosWatched, achievements } = data;

  const initials = (profile.username ?? "?")
    .slice(0, 2)
    .toUpperCase();

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      {/* Avatar + identity */}
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/30">
          {initials}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-none">@{profile.username}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={profile.level} />
            <span className="text-xs text-muted-foreground">Member since {memberSince}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="SOL Earned" value={profile.total_earned.toLocaleString()} />
        <StatCard label="Videos Watched" value={videosWatched.toString()} />
        <StatCard label="Streak" value={`${profile.streak_count} days`} />
        <StatCard label="Total XP" value={profile.xp.toLocaleString()} />
      </div>

      {/* XP progress */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Progress
        </h2>
        <XPProgressBar xp={profile.xp} />
      </section>

      {/* Achievements */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Achievements
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
