import { AppConfigService } from '../../config/app-config.service';
import { NodemailerOtpSender } from './nodemailer-otp-sender.service';
import { OTP_EMAIL_SUBJECTS } from './otp-sender.constants';

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

describe('NodemailerOtpSender', () => {
  beforeEach(() => {
    sendMailMock.mockReset();
  });

  it.each([
    ['sign-in', OTP_EMAIL_SUBJECTS['sign-in']],
    ['email-verification', OTP_EMAIL_SUBJECTS['email-verification']],
    ['forget-password', OTP_EMAIL_SUBJECTS['forget-password']],
    ['change-email', OTP_EMAIL_SUBJECTS['change-email']],
  ] as const)(
    'sends the correct subject and OTP for type %s',
    async (type, expectedSubject) => {
      sendMailMock.mockResolvedValue({});
      const sender = new NodemailerOtpSender(createAppConfigStub());

      await sender.send({ email: 'user@example.com', otp: '123456', type });

      expect(sendMailMock).toHaveBeenCalledWith({
        from: 'no-reply@example.com',
        to: 'user@example.com',
        subject: expectedSubject,
        text: expect.stringContaining('123456') as string,
      });
    },
  );

  it('propagates rejection when sendMail fails', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP down'));
    const sender = new NodemailerOtpSender(createAppConfigStub());

    await expect(
      sender.send({
        email: 'user@example.com',
        otp: '123456',
        type: 'sign-in',
      }),
    ).rejects.toThrow('SMTP down');
  });
});
