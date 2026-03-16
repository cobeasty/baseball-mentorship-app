/**
 * VideoEmbed — smart video player.
 * Detects YouTube, Vimeo, or raw video files and renders the right player.
 */

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

interface VideoEmbedProps {
  url: string;
  title?: string;
}

export function VideoEmbed({ url, title = "Training video" }: VideoEmbedProps) {
  const youtubeId = getYouTubeId(url);
  const vimeoId = !youtubeId ? getVimeoId(url) : null;

  const wrapperCls =
    "relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl";

  if (youtubeId) {
    return (
      <div className={wrapperCls}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className={wrapperCls}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://player.vimeo.com/video/${vimeoId}?color=primary&title=0&byline=0`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Raw video file (.mp4, .webm, etc.)
  return (
    <div className={wrapperCls}>
      <video
        className="absolute inset-0 w-full h-full"
        controls
        title={title}
        preload="metadata"
      >
        <source src={url} />
        <p className="text-muted-foreground p-4 text-sm">
          Your browser doesn't support this video format.{" "}
          <a href={url} className="text-primary underline" target="_blank" rel="noreferrer">
            Open video
          </a>
        </p>
      </video>
    </div>
  );
}
