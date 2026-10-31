import { youtubeEmbedUrl } from "@/lib/youtube";

type YoutubePlayerProps = {
  videoId: string;
  title: string;
  autoPlay?: boolean;
};

export function YoutubePlayer({ videoId, title, autoPlay = false }: YoutubePlayerProps) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        className="size-full"
        src={youtubeEmbedUrl(videoId, autoPlay)}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
