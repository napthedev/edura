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

// ======== PARENT NOTIFICATION EMAILS ========

interface PerformanceData {
  assignmentCount: number;
  averageGrade: number;
  accuracyPercentage: number;
  trend: "improving" | "stable" | "declining";
}

interface SendWeeklyPerformanceReportParams {
  studentEmail: string;
  parentEmail: string;
  studentName: string;
  className: string;
  performanceData: PerformanceData;
}

export async function sendWeeklyPerformanceReport({
  studentEmail,
  parentEmail,
  studentName,
  className,
  performanceData,
}: SendWeeklyPerformanceReportParams) {
  const resend = getResendClient();

  const trendLabel =
    performanceData.trend === "improving"
      ? "Improving ⬆️"
      : performanceData.trend === "declining"
      ? "Declining ⬇️"
      : "Stable →";

  const trendLabelVi =
    performanceData.trend === "improving"
      ? "Đang cải thiện ⬆️"
      : performanceData.trend === "declining"
      ? "Đang suy giảm ⬇️"
      : "Ổn định →";

  const recipients = [studentEmail, parentEmail].filter(Boolean);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Edura <onboarding@resend.dev>",
    to: recipients,
    subject: `Weekly Performance Report - ${className}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Performance Report</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- English Section -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Weekly Performance Report</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;"><strong>${className}</strong></p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px;">Hello <strong>${studentName}</strong>,</p>
          
          <p>Here's your weekly performance summary for <strong>${className}</strong>:</p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div style="border-left: 4px solid #667eea; padding-left: 15px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Assignments Completed</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #667eea;">${
                  performanceData.assignmentCount
                }</p>
              </div>
              <div style="border-left: 4px solid #764ba2; padding-left: 15px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Average Grade</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #764ba2;">${performanceData.averageGrade.toFixed(
                  1
                )}%</p>
              </div>
              <div style="border-left: 4px solid #f59e0b; padding-left: 15px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Accuracy Rate</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #f59e0b;">${performanceData.accuracyPercentage.toFixed(
                  1
                )}%</p>
              </div>
              <div style="border-left: 4px solid #10b981; padding-left: 15px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Trend</p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; color: #10b981;">${trendLabel}</p>
              </div>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px;">Keep up the great work! Log in to Edura to view detailed feedback and assignment details.</p>
        </div>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            © ${new Date().getFullYear()} Edura. All rights reserved.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <!-- Vietnamese Section -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Báo Cáo Thành Tích Hàng Tuần</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;"><strong>${className}</strong></p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Xin chào <strong>${studentName}</strong>,</p>
          
          <p>Đây là tóm tắt thành tích hàng tuần của bạn cho <strong>${className}</strong>:</p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div style="border-left: 4px solid #667eea; padding-left: 15px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Bài Tập Hoàn Thành</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #667eea;">${
                  performanceData.assignmentCount
                }</p>
              </div>
              <div style="border-left: 4px solid #764ba2; padding-left: 15px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Điểm Trung Bình</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #764ba2;">${performanceData.averageGrade.toFixed(
                  1
                )}%</p>
              </div>
              <div style="border-left: 4px solid #f59e0b; padding-left: 15px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Tỷ Lệ Chính Xác</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #f59e0b;">${performanceData.accuracyPercentage.toFixed(
                  1
                )}%</p>
              </div>
              <div style="border-left: 4px solid #10b981; padding-left: 15px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Xu Hướng</p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; color: #10b981;">${trendLabelVi}</p>
              </div>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px;">Hãy tiếp tục cố gắng! Đăng nhập vào Edura để xem phản hồi chi tiết và thông tin bài tập.</p>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send weekly performance report:", error);
    throw new Error(
      `Failed to send weekly performance report: ${error.message}`
    );
  }

  return data;
}

interface BillingData {
  amount: number;
  billingMonth: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paymentMethods: string[];
  invoiceNumber?: string;
}

interface SendMonthlyBillingReportParams {
  studentEmail: string;
  parentEmail: string;
  studentName: string;
  className: string;
  billingData: BillingData;
}

export async function sendMonthlyBillingReport({
  studentEmail,
  parentEmail,
  studentName,
  className,
  billingData,
}: SendMonthlyBillingReportParams) {
  const resend = getResendClient();

  const statusColor =
    billingData.status === "paid"
      ? "#10b981"
      : billingData.status === "overdue"
      ? "#ef4444"
      : "#f59e0b";

  const statusLabel =
    billingData.status === "paid"
      ? "Paid ✓"
      : billingData.status === "overdue"
      ? "Overdue ⚠️"
      : "Pending";

  const statusLabelVi =
    billingData.status === "paid"
      ? "Đã Thanh Toán ✓"
      : billingData.status === "overdue"
      ? "Quá Hạn ⚠️"
      : "Đang Chờ";

  const recipients = [studentEmail, parentEmail].filter(Boolean);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Edura <onboarding@resend.dev>",
    to: recipients,
    subject: `Monthly Billing Report - ${className} (${billingData.billingMonth})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Billing Report</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- English Section -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Monthly Billing Report</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;"><strong>${className}</strong> • ${
      billingData.billingMonth
    }</p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px;">Hello <strong>${studentName}</strong>,</p>
          
          <p>Here is your tuition billing information for <strong>${className}</strong>:</p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Invoice Number:</span>
                <span style="font-weight: bold;">${
                  billingData.invoiceNumber || "N/A"
                }</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Billing Period:</span>
                <span style="font-weight: bold;">${
                  billingData.billingMonth
                }</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Due Date:</span>
                <span style="font-weight: bold;">${billingData.dueDate}</span>
              </div>
            </div>

            <div style="margin-bottom: 20px; padding: 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Amount Due</p>
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #667eea;">₫${billingData.amount.toLocaleString(
                "vi-VN"
              )}</p>
            </div>

            <div style="margin-bottom: 20px; padding: 12px; background-color: ${statusColor}22; border-left: 4px solid ${statusColor}; border-radius: 4px;">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Payment Status</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${statusColor};">${statusLabel}</p>
            </div>

            <div>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Accepted Payment Methods:</p>
              <ul style="margin: 0; padding-left: 20px;">
                ${billingData.paymentMethods
                  .map(
                    (method) =>
                      `<li style="margin: 4px 0; color: #333;">${method}</li>`
                  )
                  .join("")}
              </ul>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px;">If you have any questions about your billing, please contact your learning center.</p>
        </div>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            © ${new Date().getFullYear()} Edura. All rights reserved.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <!-- Vietnamese Section -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Báo Cáo Hóa Đơn Hàng Tháng</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;"><strong>${className}</strong> • ${
      billingData.billingMonth
    }</p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Xin chào <strong>${studentName}</strong>,</p>
          
          <p>Đây là thông tin hóa đơn học phí của bạn cho <strong>${className}</strong>:</p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Số Hóa Đơn:</span>
                <span style="font-weight: bold;">${
                  billingData.invoiceNumber || "N/A"
                }</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Kỳ Thanh Toán:</span>
                <span style="font-weight: bold;">${
                  billingData.billingMonth
                }</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Hạn Thanh Toán:</span>
                <span style="font-weight: bold;">${billingData.dueDate}</span>
              </div>
            </div>

            <div style="margin-bottom: 20px; padding: 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Số Tiền Cần Thanh Toán</p>
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #667eea;">₫${billingData.amount.toLocaleString(
                "vi-VN"
              )}</p>
            </div>

            <div style="margin-bottom: 20px; padding: 12px; background-color: ${statusColor}22; border-left: 4px solid ${statusColor}; border-radius: 4px;">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Trạng Thái Thanh Toán</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${statusColor};">${statusLabelVi}</p>
            </div>

            <div>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Phương Thức Thanh Toán Chấp Nhận:</p>
              <ul style="margin: 0; padding-left: 20px;">
                ${billingData.paymentMethods
                  .map(
                    (method) =>
                      `<li style="margin: 4px 0; color: #333;">${method}</li>`
                  )
                  .join("")}
              </ul>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px;">Nếu bạn có bất kỳ câu hỏi nào về hóa đơn của mình, vui lòng liên hệ với trung tâm học tập của bạn.</p>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send monthly billing report:", error);
    throw new Error(`Failed to send monthly billing report: ${error.message}`);
  }

  return data;
}

interface SendUrgentAlertParams {
  studentEmail: string;
  parentEmail: string;
  studentName: string;
  title: string;
  message: string;
}

export async function sendUrgentAlert({
  studentEmail,
  parentEmail,
  studentName,
  title,
  message,
}: SendUrgentAlertParams) {
  const resend = getResendClient();

  const recipients = [studentEmail, parentEmail].filter(Boolean);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Edura <onboarding@resend.dev>",
    to: recipients,
    subject: `⚠️ Urgent Alert from Edura: ${title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Urgent Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- English Section -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Urgent Alert</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;"><strong>${title}</strong></p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px;">Hello <strong>${studentName}</strong>,</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1f2937; line-height: 1.8;">${message}</p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Please log in to Edura for more information or contact your teacher/learning center.</p>
        </div>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            © ${new Date().getFullYear()} Edura. All rights reserved.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <!-- Vietnamese Section -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Cảnh Báo Khẩn Cấp</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;"><strong>${title}</strong></p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Xin chào <strong>${studentName}</strong>,</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1f2937; line-height: 1.8;">${message}</p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Vui lòng đăng nhập vào Edura để biết thêm thông tin hoặc liên hệ với giáo viên/trung tâm học tập của bạn.</p>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send urgent alert:", error);
    throw new Error(`Failed to send urgent alert: ${error.message}`);
  }

  return data;
}

// ======== MANAGER ACCOUNT EMAIL ========

interface SendManagerAccountEmailParams {
  contactName: string;
  contactEmail: string;
  centerName: string;
  managerEmail: string;
  managerPassword: string;
  phone?: string;
  studentCount?: number;
  message?: string;
}

export async function sendManagerAccountEmail({
  contactName,
  contactEmail,
  centerName,
  managerEmail,
  managerPassword,
  phone,
  studentCount,
  message,
}: SendManagerAccountEmailParams) {
  const resend = getResendClient();
  const loginUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "https://edura.com"
  }/login`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Edura <onboarding@resend.dev>",
    to: [contactEmail],
    subject:
      "Your Edura Manager Account Has Been Created - Account Details Included",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Edura Manager Account</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Edura!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Manager Account is Ready</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px;">Hello <strong>${contactName}</strong>,</p>
          
          <p>Thank you for your interest in Edura! Your manager account for <strong>${centerName}</strong> has been created. Below are your login credentials:</p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Manager Email:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${managerEmail}</code></p>
            <p style="margin: 0;"><strong>Password:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${managerPassword}</code></p>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Important:</strong> For your security, please change your password immediately after your first login. Keep these credentials safe and do not share them with others.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Login to Your Account
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${loginUrl}" style="color: #667eea;">${loginUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <h3 style="color: #667eea; margin-top: 0;">Your Information Summary</h3>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Contact Person:</strong> ${contactName}</p>
            <p style="margin: 5px 0;"><strong>Center Name:</strong> ${centerName}</p>
            ${
              phone
                ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>`
                : ""
            }
            ${
              studentCount
                ? `<p style="margin: 5px 0;"><strong>Estimated Students:</strong> ${studentCount}</p>`
                : ""
            }
            ${
              message
                ? `<p style="margin: 5px 0;"><strong>Additional Notes:</strong> ${message}</p>`
                : ""
            }
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Our team will review your information and may reach out if we have any questions. You can start setting up your first class immediately!
          </p>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            © ${new Date().getFullYear()} Edura. All rights reserved.
          </p>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
            Questions? Contact our support team at support@edura.com
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <!-- Vietnamese version -->
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #667eea; margin-top: 0;">Chào mừng đến với Edura!</h2>
          <p>Xin chào <strong>${contactName}</strong>,</p>
          
          <p>Cảm ơn bạn đã quan tâm đến Edura! Tài khoản quản lý viên của bạn cho <strong>${centerName}</strong> đã được tạo. Dưới đây là thông tin đăng nhập của bạn:</p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Email Quản Lý Viên:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${managerEmail}</code></p>
            <p style="margin: 0;"><strong>Mật Khẩu:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${managerPassword}</code></p>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Quan trọng:</strong> Vì lý do bảo mật, vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên. Giữ thông tin đăng nhập an toàn và không chia sẻ với người khác.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Đăng Nhập Vào Tài Khoản
            </a>
          </div>
          
          <h3 style="color: #667eea;">Tóm Tắt Thông Tin Của Bạn</h3>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Người Liên Hệ:</strong> ${contactName}</p>
            <p style="margin: 5px 0;"><strong>Tên Trung Tâm:</strong> ${centerName}</p>
            ${
              phone
                ? `<p style="margin: 5px 0;"><strong>Điện Thoại:</strong> ${phone}</p>`
                : ""
            }
            ${
              studentCount
                ? `<p style="margin: 5px 0;"><strong>Số Học Sinh Ước Tính:</strong> ${studentCount}</p>`
                : ""
            }
            ${
              message
                ? `<p style="margin: 5px 0;"><strong>Ghi Chú Thêm:</strong> ${message}</p>`
                : ""
            }
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Đội ngũ của chúng tôi sẽ xem xét thông tin của bạn và có thể liên hệ nếu có câu hỏi. Bạn có thể bắt đầu thiết lập lớp đầu tiên của mình ngay lập tức!
          </p>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send manager account email:", error);
    throw new Error(`Failed to send manager account email: ${error.message}`);
  }

  return data;
}
