"use server";

import nmtx from "@/lib/mail";

export default async function getInTouch(formData: Awaited<FormData>) {
  let companyName = formData.get('companyName')?.toString()?.trim();
  let fullName = formData.get('fullName')?.toString()?.trim();
  let email = formData.get('email')?.toString()?.trim();
  let mobile = formData.get('mobile')?.toString()?.trim();
  let website = formData.get('website')?.toString()?.trim();
  let currentERP = formData.get('currentERP')?.toString()?.trim();
  let message = formData.get('message')?.toString()?.trim();

  if (!companyName || !fullName || !email) return;

  const status = await nmtx.sendMail({
    from: `${fullName} - ${companyName} ${process.env.NM_UNAME}`,
    to: process.env.NM_UNAME,
    subject: `ERPNext Enquiry by ${fullName} from ${companyName}.`,
    html: `<html>
      <body>
        <h1>New Contact Form Submission</h1>
        <hr>

        <p>Company: <b>${companyName}</b></p>
        <p>Contact Person: <b>${fullName}</b></p>
        <p>Email: <b>${email}</b></p>
        <p>Mobile: <b>${mobile}</b></p>
        <p>Website: <b>${website || 'Not provided'}</b></p>
        <p>Current ERP: <b>${currentERP || 'None'}</b></p>

        <p>Message:</b>
        <pre>${message?.trim()}</pre>

        <p>Submitted on: ${new Date().toLocaleString()}</p>

        <hr>
        <p>This email was generated automatically from your contact form.</p>
      </body>
    </html>`
  });

  return status.accepted.includes(process.env.NM_UNAME!);
}