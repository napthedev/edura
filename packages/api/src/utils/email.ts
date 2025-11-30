import { Resend } from "resend";

// Lazy-loaded Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendWelcomeEmailParams {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "student";
  loginUrl: string;
  centerName?: string;
}

export async function sendWelcomeEmail({
  name,
  email,
  password,
  role,
  loginUrl,
  centerName,
}: SendWelcomeEmailParams) {
  const resend = getResendClient();
  const roleLabel = role === "teacher" ? "Teacher" : "Student";
  const roleVi = role === "teacher" ? "Giáo viên" : "Học sinh";

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Edura <onboarding@resend.dev>",
    to: [email],
    subject: `Welcome to Edura - Your ${roleLabel} Account Has Been Created`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Edura</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Edura!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your ${roleLabel} Account is Ready</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
          
          <p>Your ${roleLabel.toLowerCase()} account has been created${
      centerName ? ` for <strong>${centerName}</strong>` : ""
    }. You can now access the Edura platform using the credentials below:</p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Password:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Important:</strong> For your security, please change your password immediately after your first login.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Login to Edura
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${loginUrl}" style="color: #667eea;">${loginUrl}</a>
          </p>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            © ${new Date().getFullYear()} Edura. All rights reserved.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <!-- Vietnamese version -->
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #667eea; margin-top: 0;">Chào mừng đến với Edura!</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          
          <p>Tài khoản ${roleVi.toLowerCase()} của bạn đã được tạo${
      centerName ? ` tại <strong>${centerName}</strong>` : ""
    }. Bạn có thể đăng nhập vào nền tảng Edura với thông tin sau:</p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Mật khẩu:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Quan trọng:</strong> Vì lý do bảo mật, vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên.
            </p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Đăng nhập Edura
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send welcome email:", error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }

  return data;
}

export function generateRandomPassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one of each type
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
