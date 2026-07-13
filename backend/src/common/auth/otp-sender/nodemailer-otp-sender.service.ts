import { Injectable } from '@nestjs/common';
import { MailerService } from '../../mailer/mailer.service';
import { OTP_EMAIL_SUBJECTS } from './otp-sender.constants';
import { OtpSendParams, OtpSender } from './otp-sender.interface';

@Injectable()
export class NodemailerOtpSender implements OtpSender {
  constructor(private readonly mailer: MailerService) {}

  async send({ email, otp, type }: OtpSendParams): Promise<void> {
    await this.mailer.sendMail({
      to: email,
      subject: OTP_EMAIL_SUBJECTS[type],
      text: `Your verification code is ${otp}. It expires shortly.`,
    });
  }
}
