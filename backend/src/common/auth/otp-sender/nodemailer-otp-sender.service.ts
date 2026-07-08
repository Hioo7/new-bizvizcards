import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AppConfigService } from '../../config/app-config.service';
import { OTP_EMAIL_SUBJECTS } from './otp-sender.constants';
import { OtpSendParams, OtpSender } from './otp-sender.interface';

@Injectable()
export class NodemailerOtpSender implements OtpSender {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(appConfig: AppConfigService) {
    this.fromAddress = appConfig.smtpFrom;
    this.transporter = createTransport({
      host: appConfig.smtpHost,
      port: appConfig.smtpPort,
      secure: appConfig.smtpSecure,
      auth: {
        user: appConfig.smtpUser,
        pass: appConfig.smtpPassword,
      },
    });
  }

  async send({ email, otp, type }: OtpSendParams): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: email,
      subject: OTP_EMAIL_SUBJECTS[type],
      text: `Your verification code is ${otp}. It expires shortly.`,
    });
  }
}
