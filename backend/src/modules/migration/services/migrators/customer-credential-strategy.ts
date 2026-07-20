import { CREDENTIAL_PROVIDER_ID } from '../../../../common/auth/auth.constants';
import { PrismaService } from '../../../../common/prisma/prisma.service';

// The one isolated, swappable function for the customer password migration
// strategy — confirmed decision: copy the legacy bcrypt hash directly, no
// rehashing, no forced reset. Works because customer-auth.factory.ts's
// emailAndPassword.password is overridden to bcrypt (customer-password-hasher.ts)
// specifically so this is safe — legacy CardUser.password is already a
// bcryptjs hash at the same rounds. If the credential strategy ever needs to
// change, this is the only file to touch.
//
// accountId = userId = customerAccountId for a 'credential' provider row —
// matches better-auth's own convention (see CustomersService.setPasswordForEmployee,
// which hand-writes CustomerCredential rows the same way for the admin
// set-password flow).
export async function applyCustomerCredentialStrategy(
  prisma: PrismaService,
  params: { legacyPasswordHash: string | null; customerAccountId: string },
): Promise<void> {
  if (!params.legacyPasswordHash) {
    return;
  }

  await prisma.customerCredential.create({
    data: {
      accountId: params.customerAccountId,
      userId: params.customerAccountId,
      providerId: CREDENTIAL_PROVIDER_ID,
      password: params.legacyPasswordHash,
    },
  });
}
