import { AppConfigService } from '../config/app-config.service';
import { MailerService } from './mailer.service';

const sendMailMock = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: sendMailMock })),
}));

function createAppConfigStub(): AppConfigService {
  return {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: 'user',
    smtpPassword: 'pass',
    smtpFrom: 'no-reply@example.com',
  } as unknown as AppConfigService;
}

describe('MailerService', () => {
  beforeEach(() => {
    sendMailMock.mockReset();
  });

  it('sends mail with the configured from-address and given fields', async () => {
    sendMailMock.mockResolvedValue({});
    const mailer = new MailerService(createAppConfigStub());

    await mailer.sendMail({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body text',
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body text',
    });
  });

  it('includes html when provided', async () => {
    sendMailMock.mockResolvedValue({});
    const mailer = new MailerService(createAppConfigStub());

    await mailer.sendMail({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body text',
      html: '<p>Body text</p>',
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body text',
      html: '<p>Body text</p>',
    });
  });

  it('propagates rejection when sendMail fails', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP down'));
    const mailer = new MailerService(createAppConfigStub());

    await expect(
      mailer.sendMail({
        to: 'user@example.com',
        subject: 'Subject',
        text: 'Body text',
      }),
    ).rejects.toThrow('SMTP down');
  });
});
