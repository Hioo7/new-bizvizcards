export function toAbsoluteUrl(baseUrl: string, url: string): string {
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  return `${baseUrl}${url}`;
}
