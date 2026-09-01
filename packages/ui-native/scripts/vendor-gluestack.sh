#!/usr/bin/env bash
# Re-vendor the gluestack-ui v3 component sources from the main-v3 branch.
# The gluestack v3 CLI can't run headless (uv_tty_init EBADF), so we do what it
# does internally: shallow-clone the branch and copy src/components/ui/<name>/*.tsx.
#
# Usage:  bash scripts/vendor-gluestack.sh [component ...]
#         (no args = the default set below)
set -euo pipefail

BRANCH=main-v3
REPO=https://github.com/gluestack/gluestack-ui.git
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DST="$HERE/src/components/ui"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

DEFAULT_SET="button icon input textarea form-control select actionsheet checkbox radio switch avatar badge spinner toast card pressable box hstack vstack center fab divider gluestack-ui-provider"
COMPONENTS="${*:-$DEFAULT_SET}"

echo "cloning $REPO#$BRANCH (sparse) ..."
git clone --depth 1 --branch "$BRANCH" --filter=blob:none --sparse "$REPO" "$TMP/gs" >/dev/null 2>&1
git -C "$TMP/gs" sparse-checkout set src/components/ui >/dev/null 2>&1

for c in $COMPONENTS; do
  src="$TMP/gs/src/components/ui/$c"
  [ -d "$src" ] || { echo "  ! $c not found on $BRANCH — skipped"; continue; }
  mkdir -p "$DST/$c"
  find "$src" -maxdepth 1 -type f \( -name '*.tsx' -o -name '*.ts' \) -exec cp {} "$DST/$c/" \;
  echo "  vendored $c"
done

# gluestack-ui-provider: keep our GENERATED config.ts, drop the CLI extras.
rm -f "$DST/gluestack-ui-provider/index.next15.tsx" "$DST/gluestack-ui-provider/dependencies.json"
echo
echo "done. next: npm run gen:css   (regenerates the bizviz theme bridge)"
