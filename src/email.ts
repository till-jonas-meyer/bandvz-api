import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  secure: !!Number(process.env.SMTP_SECURE)
});

const renderTemplate = async (templateName: string, data: any) => {

  const textFile = await fs.readFile(
    path.join('src/mail/templates', `${templateName}.text.hbs`),
    'utf-8'
  );

  const htmlFile = await fs.readFile(
    path.join('src/mail/templates', `${templateName}.html.hbs`),
    'utf-8');

  const textTemplate = Handlebars.compile(textFile);
  const text = textTemplate(data);

  const htmlTemplate = Handlebars.compile(htmlFile);
  const html = htmlTemplate(data);

  return { text, html };
};

export const sendMail = async (to: string, subject: string, template: string, data: any) => {
  const templates = await renderTemplate(template, data);

  await transporter.sendMail({
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}}>`,
    to,
    subject,
    ...templates
  });
}
