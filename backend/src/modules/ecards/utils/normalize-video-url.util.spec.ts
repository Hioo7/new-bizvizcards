import { normalizeEcardVideoUrl } from './normalize-video-url.util';

describe('normalizeEcardVideoUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=sFCmU9jG79k',
    'https://youtube.com/watch?v=sFCmU9jG79k',
    'http://www.youtube.com/watch?v=sFCmU9jG79k',
    'www.youtube.com/watch?v=sFCmU9jG79k',
    'youtube.com/watch?v=sFCmU9jG79k',
    'https://m.youtube.com/watch?v=sFCmU9jG79k',
    'https://youtu.be/sFCmU9jG79k',
    'youtu.be/sFCmU9jG79k',
    'https://www.youtube.com/shorts/sFCmU9jG79k',
    'https://www.youtube.com/live/sFCmU9jG79k',
    'https://www.youtube.com/embed/sFCmU9jG79k',
    'https://www.youtube.com/watch?v=sFCmU9jG79k&t=30s',
  ])('normalizes a real-world YouTube link to the embed URL: %s', (input) => {
    expect(normalizeEcardVideoUrl(input)).toBe(
      'https://www.youtube.com/embed/sFCmU9jG79k',
    );
  });

  it.each([
    'https://vimeo.com/76979871',
    'vimeo.com/76979871',
    'www.vimeo.com/76979871',
    'https://player.vimeo.com/video/76979871',
  ])('normalizes a real-world Vimeo link to the embed URL: %s', (input) => {
    expect(normalizeEcardVideoUrl(input)).toBe(
      'https://player.vimeo.com/video/76979871',
    );
  });

  it.each([
    '',
    '   ',
    'not a url',
    'https://example.com/video',
    'https://vimeo.com/not-a-numeric-id',
    'https://www.youtube.com/',
    'https://www.youtube.com/channel/UC123',
  ])('rejects an unrecognized or non-video link: %s', (input) => {
    expect(normalizeEcardVideoUrl(input)).toBeNull();
  });
});
