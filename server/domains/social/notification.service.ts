import { run, all, get } from '../../db.js';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

// ── Lazy provider factories ───────────────────────────────────────────────────

function getTwilioClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    return twilio(sid, token);
  } catch {
    return null;
  }
}

function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  try {
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user, pass },
    });
  } catch {
    return null;
  }
}

// ── In-app notifications (always works) ──────────────────────────────────────

export const notify = async (userId: number | string, type: string, message: string) => {
  await run(
    'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
    [userId, type, message]
  );
};

export const notifyAdmins = async (type: string, message: string) => {
  const admins = await all<{ id: number }>('SELECT id FROM users WHERE user_type = "admin"');
  await Promise.all(admins.map(a => notify(a.id, type, message)));
};

// ── Email ─────────────────────────────────────────────────────────────────────

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn(`[Email] SMTP not configured — skipping email to ${to}. Set SMTP_HOST/SMTP_USER/SMTP_PASS.`);
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    const from = process.env.EMAIL_FROM ?? 'SonicStream <noreply@sonicstream.io>';
    const info = await transporter.sendMail({
      from, to, subject, html,
      text: text ?? html.replace(/<[^>]+>/g, ''),
    });
    console.log(`[Email] Sent "${subject}" to ${to} — messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ── SMS via Twilio ────────────────────────────────────────────────────────────

export const sendSMS = async (
  userId: string,
  message: string,
): Promise<{ success: boolean; id: string; error?: string }> => {
  const smsId = `sms_${Math.random().toString(36).substr(2, 9)}`;
  try {
    const user  = await get<{ phone: string }>('SELECT phone FROM users WHERE id = ?', [userId]);
    const phone = user?.phone ?? '';

    if (!phone) {
      await run(
        'INSERT INTO sms_notifications (id, user_id, phone, message, status) VALUES (?, ?, ?, ?, ?)',
        [smsId, userId, 'NO_PHONE', message, 'SKIPPED_MISSING_CONTACT']
      );
      return { success: false, id: smsId, error: 'No phone number on account' };
    }

    const twilioClient = getTwilioClient();
    const from   = process.env.TWILIO_FROM_NUMBER ?? '';

    if (!twilioClient || !from) {
      console.warn(`[SMS] Twilio not configured — skipping SMS to ${phone}.`);
      await run(
        'INSERT INTO sms_notifications (id, user_id, phone, message, status) VALUES (?, ?, ?, ?, ?)',
        [smsId, userId, phone, message, 'SKIPPED_NOT_CONFIGURED']
      );
      return { success: false, id: smsId, error: 'Twilio not configured' };
    }

    const msg = await twilioClient.messages.create({ body: message, from, to: phone });
    await run(
      'INSERT INTO sms_notifications (id, user_id, phone, message, status, provider_id) VALUES (?, ?, ?, ?, ?, ?)',
      [smsId, userId, phone, message, 'DELIVERED', msg.sid]
    );
    console.log(`[SMS] Sent to ${phone} — sid: ${msg.sid}`);
    return { success: true, id: smsId };

  } catch (err: any) {
    console.error('[SMS] Send failed:', err.message);
    await run(
      'INSERT INTO sms_notifications (id, user_id, phone, message, status) VALUES (?, ?, ?, ?, ?)',
      [smsId, userId, '', message, 'FAILED']
    ).catch(() => {});
    return { success: false, id: smsId, error: err.message };
  }
};

// ── Push via Firebase Cloud Messaging ────────────────────────────────────────

export const sendPush = async (
  userId: string,
  title: string,
  body: string,
): Promise<{ success: boolean; id: string; error?: string }> => {
  const pushId = `psh_${Math.random().toString(36).substr(2, 9)}`;
  try {
    const user  = await get<{ push_token: string }>('SELECT push_token FROM users WHERE id = ?', [userId]);
    const token = user?.push_token ?? '';

    if (!token) {
      await run(
        'INSERT INTO push_notifications (id, user_id, push_token, title, body, status) VALUES (?, ?, ?, ?, ?, ?)',
        [pushId, userId, 'NO_TOKEN', title, body, 'SKIPPED_MISSING_TOKEN']
      );
      return { success: false, id: pushId, error: 'No push token on account' };
    }

    try {
      const { isFirebaseAvailable, getApp } = await import('../../services/firebase.js');
      if (!isFirebaseAvailable()) throw new Error('Firebase not ready');

      const { getMessaging } = await import('firebase-admin/messaging');
      const response = await getMessaging(getApp()).send({ notification: { title, body }, token });

      await run(
        'INSERT INTO push_notifications (id, user_id, push_token, title, body, status, provider_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [pushId, userId, token, title, body, 'DELIVERED', response]
      );
      console.log(`[Push] Sent to user ${userId} — FCM response: ${response}`);
      return { success: true, id: pushId };

    } catch (fcmErr: any) {
      // Stale token — clean it up so we don't keep retrying
      if (fcmErr.code === 'messaging/registration-token-not-registered') {
        await run('UPDATE users SET push_token = NULL WHERE id = ?', [userId]);
      }
      throw fcmErr;
    }

  } catch (err: any) {
    console.error(`[Push] Failed for user ${userId}:`, err.message);
    await run(
      'INSERT INTO push_notifications (id, user_id, push_token, title, body, status) VALUES (?, ?, ?, ?, ?, ?)',
      [pushId, userId, '', title, body, 'FAILED']
    ).catch(() => {});
    return { success: false, id: pushId, error: err.message };
  }
};

// ── Campaign runner ───────────────────────────────────────────────────────────

export const triggerCampaignChannel = async (campaignId: string): Promise<boolean> => {
  try {
    const campaign = await get<any>('SELECT * FROM marketing_campaigns WHERE id = ?', [campaignId]);
    if (!campaign) throw new Error(`Campaign "${campaignId}" not found`);

    await run('UPDATE marketing_campaigns SET status = "processing" WHERE id = ?', [campaignId]);

    let query = 'SELECT id, email, phone, push_token FROM users WHERE 1=1';
    if (campaign.targetSegment === 'pro')       query += ' AND (subscription_tier = "pro" OR is_pro = 1)';
    if (campaign.targetSegment === 'listeners') query += ' AND user_type = "listener"';

    const targets = await all<any>(query);
    console.log(`[Campaign] "${campaign.name}" — targeting ${targets.length} users`);

    for (const target of targets) {
      const sends: Promise<any>[] = [];

      if (['EMAIL', 'OMNICHANNEL'].includes(campaign.triggerType) && target.email) {
        sends.push(sendEmail(target.email, campaign.subject ?? 'SonicStream Update', campaign.body));
      }
      if (['SMS', 'OMNICHANNEL'].includes(campaign.triggerType)) {
        sends.push(sendSMS(target.id, campaign.body));
      }
      if (['PUSH', 'OMNICHANNEL'].includes(campaign.triggerType)) {
        sends.push(sendPush(target.id, campaign.subject ?? 'SonicStream Update', campaign.body));
      }

      await Promise.allSettled(sends);
      await notify(target.id, 'marketing_campaign', `${campaign.subject}: ${campaign.body.slice(0, 50)}...`);
      await run(
        'INSERT INTO campaign_subscribers (id, campaign_id, user_id, status) VALUES (?, ?, ?, ?)',
        [`sub_${Math.random().toString(36).substr(2, 9)}`, campaignId, target.id, 'SENT']
      );
    }

    await run('UPDATE marketing_campaigns SET status = "sent" WHERE id = ?', [campaignId]);
    return true;
  } catch (err) {
    console.error(`[Campaign] ${campaignId} failed:`, err);
    await run('UPDATE marketing_campaigns SET status = "failed" WHERE id = ?', [campaignId]);
    return false;
  }
};
