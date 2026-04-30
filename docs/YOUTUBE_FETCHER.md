# YouTube Fetcher Edge Function

Edge function untuk sinkronisasi video YouTube dari channel atau playlist ke database Supabase.

## Setup

### 1. Environment Variables

Tambahkan ke `.env.local`:

```env
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Supabase (untuk edge function)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Deploy Edge Function

```bash
# Install Supabase CLI jika belum
npm install -g supabase

# Login ke Supabase
supabase login

# Deploy edge function
supabase functions deploy sync-youtube-videos

# Set environment variables di Supabase
supabase secrets set YOUTUBE_API_KEY=your_youtube_api_key_here
```

## Usage

### Dari Client Side

```typescript
import { syncYouTubeVideos } from "@/lib/youtube/sync";

// Sync dari YouTube Channel
const result = await syncYouTubeVideos({
  source: "channel",
  id: "UCxxxxxx", // YouTube Channel ID
  maxResults: 50,
  rewardAmount: 15,
  minWatchPercentage: 0.75,
});

if (result.success) {
  console.log(`Added ${result.videosAdded} videos`);
} else {
  console.error(result.message);
}
```

### Shorthand Functions

```typescript
import { syncChannelVideos, syncPlaylistVideos } from "@/lib/youtube/sync";

// Sync channel
await syncChannelVideos("UCxxxxxx", 30, 15);

// Sync playlist
await syncPlaylistVideos("PLxxxxxx", 50, 10);
```

### Dari API Route

```bash
POST /api/admin/videos/sync
Content-Type: application/json

{
  "source": "channel",
  "id": "UCxxxxxx",
  "maxResults": 50,
  "rewardAmount": 15,
  "minWatchPercentage": 0.75
}
```

### Response

```json
{
  "success": true,
  "videosAdded": 25,
  "videosUpdated": 0,
  "message": "Successfully synced 25 videos from channel"
}
```

## How It Works

1. **Fetch Video IDs** - Query YouTube API untuk mendapatkan daftar video IDs dari channel/playlist
2. **Get Details** - Fetch metadata lengkap (title, description, duration, thumbnail) untuk setiap video
3. **Transform** - Convert YouTube API responses ke format database
4. **Upsert** - Insert atau update video di Supabase (by `youtube_video_id` uniqueness)

## Edge Function Structure

### Input

```typescript
interface SyncRequest {
  source: "channel" | "playlist";  // Tipe sumber
  id: string;                       // Channel ID atau Playlist ID
  maxResults?: number;             // Default: 50 (max)
  rewardAmount?: number;           // Default: 10
  minWatchPercentage?: number;     // Default: 0.7 (70%)
}
```

### Output

```typescript
interface SyncResponse {
  success: boolean;
  videosAdded: number;
  videosUpdated: number;
  message: string;
  errors?: string[];
}
```

## Database Schema

Videos disimpan ke tabel `videos` dengan field:

```sql
- youtube_video_id (unique)
- title
- description
- thumbnail_url
- duration_seconds
- published_at
- reward_amount
- min_watch_percentage
- is_active
```

## Error Handling

- **Invalid API Key** - Periksa `YOUTUBE_API_KEY` di environment variables
- **Missing Supabase Credentials** - Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tersedia
- **YouTube API Errors** - Check YouTube API quota dan rate limits
- **Duplicate Videos** - Videos existing akan di-update, tidak di-duplicate

## Limitations

- YouTube API: Max 50 videos per request
- Edge Function execution time: ~60 seconds per request
- YouTube API quota: 10,000 units per day (check your quota)

## Troubleshooting

### "YOUTUBE_API_KEY not configured"

```bash
# Set secret di Supabase
supabase secrets set YOUTUBE_API_KEY=your_key
```

### "YouTube API error: 403"

- Quota exceeded - tunggu hingga esok hari
- API key tidak valid
- Channel/Playlist ID tidak valid

### Duplicate Videos

Videos dengan `youtube_video_id` yang sama akan otomatis di-update, bukan di-duplicate.

## Next Steps

1. Create admin dashboard untuk sync videos
2. Tambahkan scheduled sync (cron job)
3. Tambahkan webhook untuk real-time video updates
4. Implementasi pagination untuk playlist besar (>50 videos)
