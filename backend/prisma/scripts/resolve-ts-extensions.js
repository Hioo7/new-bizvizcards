// ts-node (CommonJS mode) doesn't remap the `.js`-suffixed relative imports
// that Prisma's "nodenext"-aware generator emits back to their `.ts` source
// files — the same issue jest.moduleNameMapper works around for tests. This
// require hook applies the equivalent fallback for `ts-node`-run scripts.
const Module = require('module');

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, ...rest) {
  if (
    request.endsWith('.js') &&
    (request.startsWith('./') || request.startsWith('../'))
  ) {
    try {
      return originalResolveFilename.call(this, request, ...rest);
    } catch {
      return originalResolveFilename.call(
        this,
        request.slice(0, -'.js'.length) + '.ts',
        ...rest,
      );
    }
  }
  return originalResolveFilename.call(this, request, ...rest);
};
