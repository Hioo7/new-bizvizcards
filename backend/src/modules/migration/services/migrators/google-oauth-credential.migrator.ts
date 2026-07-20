import { GOOGLE_PROVIDER_ID } from '../../../../common/auth/auth.constants';
import { PrismaService } from '../../../../common/prisma/prisma.service';

// Always applied (not swappable, unlike customer-credential-strategy.ts) —
// pre-links a migrated customer's Google account so they keep signing in
// with Google exactly as before, with no re-consent needed. Independent of
// the password credential strategy — a customer with both a password and a
// googleId gets both CustomerCredential rows.
//
// Legacy CardUser.googleId is Google's `sub` claim (verified in
// legacy-artifacts/cards-app/src/app/api/carduser/oauth/callback/route.ts).
// better-auth matches social sign-ins by (providerId, accountId), not
// email, so accountId here must be exactly that sub value — the same value
// better-auth's own Google provider will look up on the customer's next
// real sign-in.
export async function applyGoogleOAuthCredential(
  prisma: PrismaService,
  params: { legacyGoogleId: string | null; customerAccountId: string },
): Promise<void> {
  if (!params.legacyGoogleId) {
    return;
  }

  await prisma.customerCredential.create({
    data: {
      accountId: params.legacyGoogleId,
      userId: params.customerAccountId,
      providerId: GOOGLE_PROVIDER_ID,
    },
  });
}
