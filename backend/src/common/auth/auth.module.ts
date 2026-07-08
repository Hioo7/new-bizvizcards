import { Global, Module } from '@nestjs/common';
import { CUSTOMER_AUTH, EMPLOYEE_AUTH } from './auth.constants';
import { customerAuthProvider } from './customer-auth.provider';
import { employeeAuthProvider } from './employee-auth.provider';
import { NodemailerOtpSender } from './otp-sender/nodemailer-otp-sender.service';

@Global()
@Module({
  providers: [NodemailerOtpSender, employeeAuthProvider, customerAuthProvider],
  exports: [EMPLOYEE_AUTH, CUSTOMER_AUTH],
})
export class AuthModule {}
