const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const getTokenFromReq = (req) => {
  const authHeader = req.headers.authorization || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) token = req.body?.accessToken || req.query?.accessToken || (req.cookies && req.cookies.sb_access_token) || '';
  return token;
};

const authMiddleware = async (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = data.user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// optionalAuth: attempt to populate req.user but never fail the request
const optionalAuth = async (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return next();

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) req.user = data.user;
  } catch (err) {
    console.error('Optional auth error:', err);
  }
  next();
};

module.exports = { authMiddleware, optionalAuth, supabase };
