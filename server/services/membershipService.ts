import { supabase } from '../../lib/supabase';
import { hashPassword } from '../../db';
import { getImmutableMembershipSequence } from './sequenceService';
import { sendCredentialsEmail, sendApprovalNotification, sendRejectionNotification } from './notificationService';
import { sendHtmlMail } from '../../lib/mailer';
import { membershipApproval, membershipRejection } from '../../server-lib/email-templates/index.js';
import { logAction } from './auditService';

function generateSecurePassword(): { username: string; password: string; tempPasswordHash: string } {
  const length = 20;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomBytes = require('crypto').randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  const username = 'AIC' + Date.now().toString(36).toUpperCase();
  const { hash, salt } = hashPassword('test123');
  const tempPasswordHash = hash + ':' + salt;
  return { username, password: 'test123', tempPasswordHash };
}

export async function generateMembershipNumber(category: string, year: number): Promise<string> {
  const seq = await getImmutableMembershipSequence(category);
  return `AIC-${category}-${year}-${String(seq).padStart(6, '0')}`;
}

export async function createMemberAccount(
  application: any,
  membershipNo: string,
  username: string,
  tempPassword: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const { hash, salt } = hashPassword(tempPassword);
    const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    const formData = application.form_data || {};
    const email = (formData.emailId || formData.email || '').trim().toLowerCase();
    const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Member';

    const { data, error } = await supabase.from('users').insert({
      id: userId,
      name,
      email,
      password_hash: hash,
      password_salt: salt,
      role: 'member',
      membership_plan: application.category,
      membership_no: membershipNo,
      membership_category: application.category,
      membership_status: 'active',
      membership_issued_at: new Date().toISOString(),
      membership_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      must_reset_password: true,
      permissions: ['access_premium_courses', 'access_course_videos', 'access_downloadable_resources', 'access_quizzes', 'access_certificates', 'access_members_only_pages'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select('id').single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A member with this email or membership number already exists.' };
      }
      return { success: false, error: error.message || 'Failed to create member account.' };
    }

    return { success: true, userId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create member account.' };
  }
}

export async function approveApplication(
  applicationId: string,
  adminUserId: string,
  reviewNotes?: string
): Promise<{ success: boolean; membershipNo?: string; tempPassword?: string; error?: string }> {
  try {
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return { success: false, error: 'Application not found.' };
    }

    if (application.status === 'Approved') {
      return { success: false, error: 'Application is already approved.' };
    }

    const year = new Date().getFullYear();
    let membershipNo = await generateMembershipNumber(application.category, year);

    let credentials = generateSecurePassword();

    let accountResult = await createMemberAccount(application, membershipNo, credentials.username, credentials.password);
    if (!accountResult.success && accountResult.error?.includes('already exists')) {
      membershipNo = await generateMembershipNumber(application.category, year);
      credentials = generateSecurePassword();
      accountResult = await createMemberAccount(application, membershipNo, credentials.username, credentials.password);
    }

    if (!accountResult.success) {
      return { success: false, error: accountResult.error };
    }

    const approvalDate = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'Approved',
        reviewed_by: adminUserId,
        reviewed_at: approvalDate,
        approval_date: approvalDate,
        review_notes: reviewNotes || null,
        updated_at: approvalDate
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Failed to update application status:', updateError);
      return { success: false, error: 'Failed to update application status.' };
    }

    const formData = application.form_data || {};
    const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Member';
    const email = (formData.emailId || formData.email || '').trim().toLowerCase();

    if (accountResult.userId) {
      await sendApprovalNotification(accountResult.userId, applicationId);
      await sendCredentialsEmail(accountResult.userId, credentials.password);
    }

    if (email) {
      const portalUrl = process.env.BASE_URL || process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || 'https://aic-aiml.org';
      const htmlBody = membershipApproval({
        name,
        membershipNo,
        applicationId: application.id,
        membershipType: application.category,
        approvalDate,
        portalUrl: `${portalUrl}/#member-login`
      });
      const textBody = `Dear ${name},\n\nCongratulations! Your AICAIML ${application.category.toUpperCase()} membership has been approved.\n\nMembership No: ${membershipNo}\nApproval Date: ${new Date(approvalDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nYour member portal credentials have been sent to this email.\n\nWelcome to AICAIML!\n\nMembership Board`;
      await sendHtmlMail(
        email,
        `[AICAIML] Membership Application Approved - ${membershipNo}`,
        htmlBody,
        textBody
      );
    }

    await logAction('approve_application', 'application', applicationId, adminUserId, { status: 'Pending' }, { status: 'Approved', membershipNo }, undefined);

    return { success: true, membershipNo, tempPassword: credentials.password };
  } catch (err: any) {
    console.error('Approve application error:', err);
    return { success: false, error: err.message || 'Failed to approve application.' };
  }
}

export async function rejectApplication(
  applicationId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return { success: false, error: 'Application not found.' };
    }

    if (application.status === 'Rejected') {
      return { success: false, error: 'Application is already rejected.' };
    }

    const rejectionDate = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'Rejected',
        rejection_reason: reason,
        reviewed_by: adminUserId,
        reviewed_at: rejectionDate,
        updated_at: rejectionDate
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Failed to reject application:', updateError);
      return { success: false, error: 'Failed to reject application.' };
    }

    const formData = application.form_data || {};
    const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Applicant';
    const email = (formData.emailId || formData.email || '').trim().toLowerCase();

    if (email) {
      const htmlBody = membershipRejection({
        name,
        membershipType: application.category,
        applicationId: application.id,
        reason
      });
      const textBody = `Dear ${name},\n\nWe regret to inform you that your AICAIML ${application.category.toUpperCase()} membership application has been reviewed and not approved at this time.\n\nReason: ${reason}\n\nYou may reapply after addressing the concerns mentioned above.\n\nRegards,\nMembership Board, AICAIML`;
      await sendHtmlMail(
        email,
        '[AICAIML] Membership Application Status Update',
        htmlBody,
        textBody
      );
    }

    await logAction('reject_application', 'application', applicationId, adminUserId, { status: 'Pending' }, { status: 'Rejected', reason }, undefined);

    return { success: true };
  } catch (err: any) {
    console.error('Reject application error:', err);
    return { success: false, error: err.message || 'Failed to reject application.' };
  }
}
