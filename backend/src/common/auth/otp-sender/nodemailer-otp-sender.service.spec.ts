import { MailerService } from '../../mailer/mailer.service';
import { NodemailerOtpSender } from './nodemailer-otp-sender.service';
import { OTP_EMAIL_SUBJECTS } from './otp-sender.constants';

function createMailerStub(): MailerService & { sendMail: jest.Mock } {
  return {
    sendMail: jest.fn().mockResolvedValue(undefined),
  } as unknown as MailerService & { sendMail: jest.Mock };
}

describe('NodemailerOtpSender', () => {
  it.each([
    ['sign-in', OTP_EMAIL_SUBJECTS['sign-in']],
    ['email-verification', OTP_EMAIL_SUBJECTS['email-verification']],
    ['forget-password', OTP_EMAIL_SUBJECTS['forget-password']],
    ['change-email', OTP_EMAIL_SUBJECTS['change-email']],
  ] as const)(
    'sends the correct subject and OTP for type %s',
    async (type, expectedSubject) => {
      const mailer = createMailerStub();
      const sender = new NodemailerOtpSender(mailer);

      await sender.send({ email: 'user@example.com', otp: '123456', type });

      expect(mailer.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: expectedSubject,
        text: expect.stringContaining('123456') as string,
      });
    },
  );

  it('propagates rejection when sendMail fails', async () => {
    const mailer = createMailerStub();
    mailer.sendMail.mockRejectedValue(new Error('SMTP down'));
    const sender = new NodemailerOtpSender(mailer);

    await expect(
      sender.send({
        email: 'user@example.com',
        otp: '123456',
        type: 'sign-in',
      }),
    ).rejects.toThrow('SMTP down');
  });
});
