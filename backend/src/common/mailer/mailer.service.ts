import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AppConfigService } from '../config/app-config.service';

export interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class MailerService {
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

  async sendMail({ to, subject, text, html }: SendMailParams): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
      ...(html !== undefined && { html }),
    });
  }
}
