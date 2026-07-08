import { Logger } from '@nestjs/common';
import {
  ACCOUNT_LINK_MAX_ATTEMPTS,
  ACCOUNT_LINK_RETRY_DELAY_MS,
} from './auth.constants';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `link` (an idempotent upsert of the business row keyed on accountId)
 * with a few retries to absorb transient DB blips. Better Auth's own account
 * row is already committed by the time this runs (databaseHooks.user.create.after
 * fires post-commit, non-transactionally) — there is no way to make this fully
 * atomic across the library boundary. On final failure this logs and returns
 * rather than throwing, so a link failure never turns into a 500 on sign-up;
 * the reconciliation script (prisma/scripts/reconcile-orphaned-accounts.ts) is
 * the safety net that repairs any row left unlinked.
 */
export async function linkAccountWithRetry(
  logContext: string,
  accountId: string,
  link: () => Promise<unknown>,
): Promise<void> {
  const logger = new Logger(logContext);

  for (let attempt = 1; attempt <= ACCOUNT_LINK_MAX_ATTEMPTS; attempt++) {
    try {
      await link();
      return;
    } catch (error) {
      const isLastAttempt = attempt === ACCOUNT_LINK_MAX_ATTEMPTS;
      if (isLastAttempt) {
        logger.error(
          `Failed to link business record for accountId=${accountId} after ${ACCOUNT_LINK_MAX_ATTEMPTS} attempts. The reconciliation script will need to repair this row.`,
          error instanceof Error ? error.stack : String(error),
        );
        return;
      }
      await delay(ACCOUNT_LINK_RETRY_DELAY_MS * attempt);
    }
  }
}
