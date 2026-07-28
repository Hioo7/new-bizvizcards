import { URL_SLUG_REGEX } from './slug.constants';

describe('URL_SLUG_REGEX', () => {
  it.each(['jane-doe', 'jane123', 'a-b-c'])(
    'matches an all-lowercase slug: %s',
    (value) => {
      expect(URL_SLUG_REGEX.test(value)).toBe(true);
    },
  );

  it.each(['JaneDoe', 'KANHAIYAAGRAWAL', 'Jane-Doe123'])(
    'matches a slug containing uppercase characters (legacy dry-run migration data): %s',
    (value) => {
      expect(URL_SLUG_REGEX.test(value)).toBe(true);
    },
  );

  it.each(['jane doe', 'jane_doe', 'jane.doe', 'jane@doe', ''])(
    'rejects a slug with spaces, underscores, dots, or other non-slug characters: %s',
    (value) => {
      expect(URL_SLUG_REGEX.test(value)).toBe(false);
    },
  );
});
