import * as React from 'react';
import { Resend } from 'resend';
import TwoFactorCodeEmail from '@/components/emails/templates/two-factor-code-email';
import { familySocialEmail, familySocialHostReference } from '@/features/family/constants/family-steps';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendTwoFactorCodeEmail = async ({
  email,
  code,
  expiresInMinutes,
}: {
  email: string;
  code: string;
  expiresInMinutes: number;
}) => {
  const siteUrl = process.env.SITE_BASE_URL ?? familySocialHostReference;

  const sendResult = await resend.emails.send({
    from: familySocialEmail,
    subject: 'Your My Family Social sign-in code',
    to: email,
    react: React.createElement(TwoFactorCodeEmail, {
      code,
      expiresInMinutes,
      siteUrl,
    }),
  });

  if (sendResult.error) {
    return {
      error: true,
      message: sendResult.error.message ?? 'The 2FA email could not be sent',
    };
  }

  return {
    error: false,
  };
};
