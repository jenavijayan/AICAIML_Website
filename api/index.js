const handlerCache = {};

async function loadHandler(path) {
  if (handlerCache[path]) return handlerCache[path];
  try {
    const mod = await import(path);
    const handler = mod.default || mod;
    handlerCache[path] = handler;
    return handler;
  } catch (err) {
    console.error('Failed to load handler:', path, err);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const url = req.url.split('?')[0];
    
    if (!process.env.SUPABASE_URL) {
       console.error('CRITICAL: SUPABASE_URL is missing in production');
    }

    if (url === '/api/auth/login') {
      const h = await loadHandler('../server-lib/api-routes/auth/login.js');
      if (!h) return res.status(500).json({ error: 'Handler not found' });
      return h(req, res);
    }
    if (url === '/api/auth/member/login') {
      const h = await loadHandler('../server-lib/api-routes/auth/member-login.js');
      if (!h) return res.status(500).json({ error: 'Handler not found' });
      return h(req, res);
    }
    if (url === '/api/auth/me') {
      const h = await loadHandler('../server-lib/api-routes/auth/me.js');
      if (!h) return res.status(500).json({ error: 'Handler not found' });
      return h(req, res);
    }
    if (url === '/api/auth/logout') {
      const h = await loadHandler('../server-lib/api-routes/auth/logout.js');
      if (!h) return res.status(500).json({ error: 'Handler not found' });
      return h(req, res);
    }
    if (url === '/api/enquiry/submit') {
      const h = await loadHandler('../server-lib/api-routes/enquiry/submit.js');
      if (!h) return res.status(500).json({ error: 'Handler not found' });
      return h(req, res);
    }
    if (url === '/api/verification/request') {
      const h = await loadHandler('../server-lib/api-routes/verification/request.js');
      if (!h) return res.status(500).json({ error: 'Handler not found' });
      return h(req, res);
    }
    if (url === '/api/verification/confirm') {
      const h = await loadHandler('../server-lib/api-routes/verification/confirm.js');
      if (!h) return res.status(500).json({ error: 'Handler not found' });
      return h(req, res);
    }

    if (url.startsWith('/api/admin')) {
       const segments = url.replace('/api/admin/', '').split('/').filter(Boolean);
       req.query.path = segments;
       const h = await loadHandler('../server-lib/api-routes/admin/[[...path]].js');
       if (!h) return res.status(500).json({ error: 'Handler not found' });
       return h(req, res);
    }

    return res.status(404).json({ error: 'Endpoint not mapped', path: url });
  } catch (err) {
    console.error('Master Controller Crash:', err);
    return res.status(500).json({ error: 'Server Crash', message: err.message });
  }
}
