import { supabase } from '../../lib/supabase';
import { sendHtmlMail } from '../../lib/mailer';
import { credentialsIssued, passwordReset } from '../../server-lib/email-templates/index.js';

export async function createNotification(notification: {
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels?: string[];
  read?: boolean;
  readAt?: string | null;
  sentAt?: string;
  createdAt?: string;
}): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      id: notification.id,
      user_id: notification.userId,
      notification_type: notification.notificationType,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      channels: notification.channels || ['in_app'],
      read: notification.read || false,
      read_at: notification.readAt || null,
      sent_at: notification.sentAt || new Date().toISOString(),
      created_at: notification.createdAt || new Date().toISOString()
    });
    if (error) {
      console.error('Failed to create notification:', error);
    }
  } catch (err) {
    console.error('Create notification error:', err);
  }
}

export async function sendApprovalNotification(userId: string, applicationId: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'membership_approved',
    title: 'Membership Application Approved',
    message: 'Your AICAIML membership application has been approved. Your credentials will be sent shortly.',
    data: { applicationId }
  });
}

export async function sendRejectionNotification(userId: string, applicationId: string, reason: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'membership_rejected',
    title: 'Membership Application Rejected',
    message: `Your AICAIML membership application has been rejected. Reason: ${reason}`,
    data: { applicationId, reason }
  });
}

export async function sendCredentialsEmail(userId: string, tempPassword: string): Promise<void> {
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  if (!user || !user.email) return;

  const loginUrl = process.env.BASE_URL || process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || 'https://aic-aiml.org';
  const htmlBody = credentialsIssued({
    name: user.name,
    username: user.email,
    tempPassword,
    loginUrl: `${loginUrl}/login`
  });
  const textBody = `Dear ${user.name},\n\nYour AICAIML member portal account has been created.\n\nUsername: ${user.email}\nTemporary Password: ${tempPassword}\n\nPlease log in at ${loginUrl} and change your password immediately.\n\nWelcome to AICAIML!\n\nMembership Board`;

  await sendHtmlMail(user.email, '[AICAIML] Your Member Portal Credentials', htmlBody, textBody);

  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'credentials_issued',
    title: 'Member Portal Credentials Issued',
    message: 'Your member portal login credentials have been sent to your registered email.',
    data: { username: user.email }
  });
}

export async function sendCourseEnrollmentNotification(userId: string, courseId: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'course_enrollment',
    title: 'Enrolled in Course',
    message: 'You have been enrolled in a new course.',
    data: { courseId }
  });
}

export async function sendSessionReminder(userId: string, sessionId: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'session_reminder',
    title: 'Session Reminder',
    message: 'You have an upcoming session. Please check your schedule.',
    data: { sessionId }
  });
}

export async function sendAssignmentDueNotification(userId: string, assignmentId: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'assignment_due',
    title: 'Assignment Due Soon',
    message: 'You have an assignment approaching its deadline.',
    data: { assignmentId }
  });
}

export async function sendCertificateReadyNotification(userId: string, certificateId: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'certificate_ready',
    title: 'Certificate Ready',
    message: 'Your certificate has been issued and is ready for download.',
    data: { certificateId }
  });
}

export async function sendMembershipExpiryNotification(userId: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'membership_expiry',
    title: 'Membership Expiring Soon',
    message: 'Your AICAIML membership is expiring soon. Please renew to continue enjoying benefits.',
    data: {}
  });
}

export async function sendPaymentReminder(userId: string, paymentId: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'payment_reminder',
    title: 'Payment Reminder',
    message: 'You have a pending payment. Please complete it at your earliest convenience.',
    data: { paymentId }
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.BASE_URL || process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || 'https://aic-aiml.org';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const htmlBody = passwordReset({ name: 'Member', resetUrl });
  const textBody = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nAICAIML Team`;
  await sendHtmlMail(email, '[AICAIML] Password Reset Request', htmlBody, textBody);
}

export async function sendSecurityAlert(userId: string, ipAddress: string): Promise<void> {
  await createNotification({
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    userId,
    notificationType: 'security_alert',
    title: 'Security Alert',
    message: `A login was detected from a new device/IP: ${ipAddress}. If this was not you, please secure your account immediately.`,
    data: { ipAddress }
  });
}
