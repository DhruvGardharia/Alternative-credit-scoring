import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOtpEmail = async (email, otp) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OTP Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#1e3a5f;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%);padding:36px 40px 28px;text-align:center;">
              <!-- Logo icon -->
              <div style="display:inline-block;background-color:#facc15;border-radius:12px;padding:10px 14px;margin-bottom:16px;">
                <span style="font-size:24px;">💳</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                GigCredit
              </h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">
                Financial Tools for Gig Workers
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:700;">
                Verify Your Email
              </h2>
              <p style="margin:0 0 28px;color:#93c5fd;font-size:14px;line-height:1.6;">
                Use the OTP below to complete your verification. 
                It is valid for <strong style="color:#facc15;">5 minutes</strong> only.
              </p>

              <!-- OTP Box -->
              <div style="background-color:#0f172a;border:2px solid #facc15;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#93c5fd;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                  Your One-Time Password
                </p>
                <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#facc15;font-family:'Courier New',monospace;padding:8px 0;">
                  ${otp}
                </div>
              </div>

              <!-- Warning -->
              <div style="background-color:#1e3a8a;border-left:4px solid #facc15;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
                <p style="margin:0;color:#bfdbfe;font-size:13px;line-height:1.6;">
                  ⚠️ <strong style="color:#facc15;">Never share this OTP</strong> with anyone. 
                  Our team will never ask for your OTP.
                </p>
              </div>

              <!-- Info text -->
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                If you didn't request this, you can safely ignore this email. 
                Someone may have entered your email by mistake.
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#1e3a8a;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#475569;font-size:12px;">
                © 2026 CreditFlow · All rights reserved
              </p>
              <p style="margin:0;color:#334155;font-size:11px;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  try {
    await sgMail.send({
      from: "rishabhs0615@gmail.com",
      to: email,
      subject: "🔐 Your OTP Verification Code — CreditFlow",
      html,
    });
  } catch (error) {
    console.error("SendGrid Error:", error);
    throw error;
  }
};