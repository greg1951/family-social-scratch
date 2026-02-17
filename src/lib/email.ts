import nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';

export const mailer: nodemailer.Transporter<SentMessageInfo> = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 587,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  }
})