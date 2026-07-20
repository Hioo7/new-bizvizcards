import bcrypt from 'bcryptjs';
import { CUSTOMER_PASSWORD_BCRYPT_ROUNDS } from './auth.constants';

// Backs customer-auth.factory.ts's emailAndPassword.password override, and
// is the one place customers.service.ts's admin-set-password flow must also
// hash through (see the comment on CustomersService.setPasswordForEmployee)
// so every CustomerCredential password in the system — self-service,
// admin-set, or migrated from legacy — is hashed with the exact same
// algorithm/rounds and verifies consistently.
export async function hashCustomerPassword(password: string): Promise<string> {
  return bcrypt.hash(password, CUSTOMER_PASSWORD_BCRYPT_ROUNDS);
}

export async function verifyCustomerPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
