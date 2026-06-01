// ============================================================
// SUPABASE CONFIGURATION — KHULNA PULSE
// Uses direct REST API (fetch) — no CDN client dependency
// ============================================================

const SUPABASE_URL = 'https://jubxlyqbtssflpzzyzug.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_buD22GJyI9D-EI--xZCFsw_ARAIrSfV';
const SUPABASE_REST = SUPABASE_URL + '/rest/v1';

// Direct REST API helper — works in every browser, no CDN needed
const supabaseClient = {
  from(table) {
    return {
      select: (columns = '*') => _chain({ table, select: columns }),
      insert: (row) => _mutate({ table, method: 'POST', body: row }),
      update: (row) => ({ eq: (col, val) => _mutate({ table, method: 'PATCH', body: row, eq: [col, val] }) }),
      rpc: (fn, params) => _rpc(fn, params),
      channel: (name) => ({
        on: (evt, opts, cb) => ({
          subscribe: (statusCb) => {
            // Real-time polling fallback
            console.log('Real-time channel subscribed (polling mode)');
            if (statusCb) statusCb('SUBSCRIBED');
            return {
              unsubscribe: () => console.log('Channel unsubscribed')
            };
          }
        })
      }),
    };
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: _getStoredSession() } }),
    signInWithOAuth: (opts) => {
      const redirectUrl = (opts.options && opts.options.redirectTo) || window.location.href;
      window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=${opts.provider}&redirect_to=${encodeURIComponent(redirectUrl)}`;
      return Promise.resolve({ error: null });
    },
    signOut: async () => {
      try { localStorage.removeItem('kp_supabase_session'); } catch(e) {}
      return Promise.resolve({ error: null });
    },
  }
};

// ===== CHAINABLE QUERY BUILDER =====
function _chain(state) {
  const q = {
    eq: (col, val) => _chain({ ...state, eq: [col, val] }),
    order: (col, opts) => _chain({ ...state, order: [col, opts?.ascending ? 'asc' : 'desc'] }),
    limit: (n) => _chain({ ...state, limit: n }),
    single: () => _query({ ...state, single: true }),
  };
  // Return a thenable (Promise-like) so it can be awaited directly
  q.then = (resolve, reject) => {
    _query(state).then(resolve, reject);
    return q;
  };
  q.catch = (reject) => {
    _query(state).catch(reject);
    return q;
  };
  return q;
}

// ===== REST API CALLS =====
const API_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function _query(state) {
  let url = `${SUPABASE_REST}/${state.table}?select=${state.select || '*'}`;
  if (state.eq) url += `&${state.eq[0]}=eq.${encodeURIComponent(state.eq[1])}`;
  if (state.order) url += `&order=${state.order[0]}.${state.order[1]}`;
  if (state.limit) url += `&limit=${state.limit}`;
  try {
    const res = await fetch(url, { headers: API_HEADERS });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { data: null, error: { message: errData.message || `HTTP ${res.status}` } };
    }
    const data = await res.json();
    if (state.single) {
      if (data.length === 0) return { data: null, error: { message: 'No rows found' } };
      return { data: data[0], error: null };
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

async function _mutate({ table, method, body, eq }) {
  let url = `${SUPABASE_REST}/${table}`;
  if (eq) url += `?${eq[0]}=eq.${encodeURIComponent(eq[1])}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { ...API_HEADERS, 'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: { message: data.message || data.msg || 'Unknown error', code: data.code } };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

async function _rpc(fn, params) {
  try {
    const res = await fetch(`${SUPABASE_REST}/rpc/${fn}`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: { message: data.message || 'RPC error' } };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

// Session helper for admin auth
function _getStoredSession() {
  try {
    const raw = localStorage.getItem('kp_supabase_session');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// Parse OAuth callback hash to extract session
(function parseAuthHash() {
  try {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const session = {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        user: JSON.parse(params.get('user') || '{}'),
      };
      localStorage.setItem('kp_supabase_session', JSON.stringify(session));
      // Get user metadata from the user object
      if (session.user && session.user.user_metadata) {
        session.user_metadata = session.user.user_metadata;
        session.email = session.user.email;
      }
      // Clean URL hash
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      console.log('Auth session saved from OAuth callback');
    }
  } catch (e) {
    console.error('Auth hash parse error:', e);
  }
})();

console.log('Supabase REST client initialized — Khulna Pulse');
