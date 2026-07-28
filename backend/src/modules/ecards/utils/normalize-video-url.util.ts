// Accepts whatever a non-technical user is likely to paste (watch page,
// share link, shortened youtu.be link, with/without https, with/without
// www) and normalizes it down to the exact embed URL the public renderer
// puts directly into an <iframe src>. Returns null when the input isn't a
// recognizable YouTube/Vimeo video link — this is also the XSS guard, since
// only these two exact output shapes are ever accepted.
export function normalizeEcardVideoUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const path = url.pathname;

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const embedId = path.match(/^\/embed\/([\w-]+)/)?.[1];
    if (embedId) return `https://www.youtube.com/embed/${embedId}`;

    if (path === '/watch') {
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    const shortsId = path.match(/^\/shorts\/([\w-]+)/)?.[1];
    if (shortsId) return `https://www.youtube.com/embed/${shortsId}`;

    const liveId = path.match(/^\/live\/([\w-]+)/)?.[1];
    if (liveId) return `https://www.youtube.com/embed/${liveId}`;

    return null;
  }

  if (host === 'youtu.be') {
    const videoId = path.match(/^\/([\w-]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host === 'vimeo.com') {
    const videoId = path.match(/^\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  if (host === 'player.vimeo.com') {
    const videoId = path.match(/^\/video\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  return null;
}
