import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import webpush from 'web-push';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

let cachedToken = null;
let cachedInstanceUrl = null;
const pushSubscriptionsByEmail = new Map();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@example.com';
const PUSH_NOTIFY_TOKEN = process.env.PUSH_NOTIFY_TOKEN || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function getOAuthToken() {
  if (cachedToken && cachedInstanceUrl) return { token: cachedToken, instanceUrl: cachedInstanceUrl };

  const response = await fetch(process.env.OAUTH_URL || 'https://test.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: process.env.SALESFORCE_CLIENT_ID,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET,
      username: process.env.SALESFORCE_USERNAME,
      password: process.env.SALESFORCE_PASSWORD,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OAuth failed: ${err}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Use instance_url returned by Salesforce login response whenever available.
  // This avoids hard dependency on a manually configured base URL.
  cachedInstanceUrl = data.instance_url || null;
  return { token: cachedToken, instanceUrl: cachedInstanceUrl };
}

async function callSalesforce(path, options = {}) {
  async function doCall(retry = false) {
    const { token, instanceUrl } = await getOAuthToken();
    const baseUrl =
      instanceUrl ||
      process.env.SALESFORCE_BASE_URL ||
      'https://cloudextel--ceuat.sandbox.my.salesforce.com';

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (response.status === 401 && !retry) {
      // Access token likely expired – clear cache and retry once
      cachedToken = null;
      cachedInstanceUrl = null;
      return doCall(true);
    }

    return response;
  }

  return doCall(false);
}

app.post('/api/oauth/token', async (_, res) => {
  try {
    cachedToken = null;
    cachedInstanceUrl = null;
    const { token, instanceUrl } = await getOAuthToken();
    res.json({ access_token: token, instance_url: instanceUrl });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const response = await callSalesforce('/services/apexrest/feapi/FE/login', {
      method: 'POST',
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    const response = await callSalesforce('/services/apexrest/feapi/getcases', {
      method: 'POST',
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put('/api/cases/update', async (req, res) => {
  try {
    const response = await callSalesforce('/services/apexrest/feapi/updatecase', {
      method: 'PUT',
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/push/public-key', (_, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({ success: false, message: 'Push is not configured' });
  }
  return res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', (req, res) => {
  const { email, subscription } = req.body || {};
  if (!email || !subscription?.endpoint) {
    return res.status(400).json({ success: false, message: 'email and subscription are required' });
  }

  const key = String(email).trim().toLowerCase();
  if (!pushSubscriptionsByEmail.has(key)) pushSubscriptionsByEmail.set(key, new Map());
  pushSubscriptionsByEmail.get(key).set(subscription.endpoint, subscription);
  return res.json({ success: true });
});

app.post('/api/push/unsubscribe', (req, res) => {
  const { email, endpoint } = req.body || {};
  const key = String(email || '').trim().toLowerCase();
  if (!key || !endpoint) return res.status(400).json({ success: false, message: 'email and endpoint are required' });
  const subMap = pushSubscriptionsByEmail.get(key);
  if (subMap) subMap.delete(endpoint);
  return res.json({ success: true });
});

app.post('/api/push/notify-assigned', async (req, res) => {
  try {
    if (PUSH_NOTIFY_TOKEN && req.headers['x-notify-token'] !== PUSH_NOTIFY_TOKEN) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({ success: false, message: 'Push is not configured' });
    }

    const { email, caseId, caseNumber } = req.body || {};
    const key = String(email || '').trim().toLowerCase();
    const subs = pushSubscriptionsByEmail.get(key);
    if (!subs || subs.size === 0) {
      return res.json({ success: true, sent: 0, message: 'No subscriptions for this FE' });
    }

    const payload = JSON.stringify({
      title: 'New Assigned Case',
      body: `Case #${caseNumber || caseId || ''} has been assigned to you.`,
      url: '/dashboard?tab=assigned',
      caseId: caseId || null,
    });

    let sent = 0;
    for (const [endpoint, subscription] of subs.entries()) {
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (err) {
        // Remove invalid/expired subscriptions (gone/not found)
        if (err?.statusCode === 404 || err?.statusCode === 410) subs.delete(endpoint);
      }
    }

    return res.json({ success: true, sent });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

app.listen(PORT, () => console.log(`API server running at http://localhost:${PORT}`));
