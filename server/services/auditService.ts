import { supabase } from '../../lib/supabase';

export interface AuditLogInput {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
  createdAt?: string;
}

function parseUserAgent(ua: string | undefined): { browser?: string; os?: string; device?: string } {
  if (!ua) return {};
  const result: { browser?: string; os?: string; device?: string } = {};

  if (/Windows/i.test(ua)) result.os = 'Windows';
  else if (/Mac OS X/i.test(ua)) result.os = 'macOS';
  else if (/Linux/i.test(ua)) result.os = 'Linux';
  else if (/Android/i.test(ua)) result.os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(ua)) result.os = 'iOS';

  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) result.browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) result.browser = 'Safari';
  else if (/Firefox/i.test(ua)) result.browser = 'Firefox';
  else if (/Edge/i.test(ua)) result.browser = 'Edge';
  else if (/MSIE|Trident/i.test(ua)) result.browser = 'Internet Explorer';

  if (/Mobile|Android|iPhone/i.test(ua)) result.device = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) result.device = 'Tablet';
  else result.device = 'Desktop';

  return result;
}

export function extractDeviceInfo(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): Record<string, unknown> {
  const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : undefined;
  const parsed = parseUserAgent(ua);
  return {
    ip_address: req.ip,
    user_agent: ua,
    ...parsed
  };
}

export async function logAction(
  action: string,
  resourceType: string,
  resourceId: string | undefined,
  userId: string | undefined,
  oldValues: Record<string, unknown> | undefined,
  newValues: Record<string, unknown> | undefined,
  req: { ip?: string; headers: Record<string, string | string[] | undefined> } | undefined
): Promise<void> {
  try {
    const deviceInfo = req ? extractDeviceInfo(req) : {};
    const ipAddress = req?.ip || (deviceInfo.ip_address as string | undefined);
    const ua = typeof req?.headers['user-agent'] === 'string' ? req.headers['user-agent'] : Array.isArray(req?.headers['user-agent']) ? req.headers['user-agent'][0] : undefined;

    const log: AuditLogInput = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      action,
      resourceType,
      resourceId,
      userId,
      oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : undefined,
      newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : undefined,
      ipAddress,
      userAgent: ua,
      deviceInfo,
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase.from('audit_logs').insert(log);
    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export async function getAuditLogs(filters: {
  userId?: string;
  resourceType?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });

  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.resourceType) query = query.eq('resource_type', filters.resourceType);
  if (filters.action) query = query.eq('action', filters.action);

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], total: count || 0 };
}
