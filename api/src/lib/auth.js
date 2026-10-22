// 讀取 Azure Static Web Apps 附在 API 請求上的登入資訊（x-ms-client-principal）
// 這個標頭由 Azure 在伺服器端加上，瀏覽器無法自行偽造。
export function getPrincipal(headers) {
  const raw = header(headers, 'x-ms-client-principal');
  if (!raw) return null;
  try {
    const p = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    if (!p || !p.userId) return null;
    return {
      userId: String(p.userId),
      email: String(p.userDetails || ''),
      provider: String(p.identityProvider || ''),
      roles: Array.isArray(p.userRoles) ? p.userRoles.map(String) : []
    };
  } catch {
    return null;
  }
}

export const isLearner = p => !!p && (p.roles.includes('learner') || p.roles.includes('admin'));
export const isAdmin = p => !!p && p.roles.includes('admin');

function header(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get(name);
  const k = Object.keys(headers).find(h => h.toLowerCase() === name);
  return k ? headers[k] : null;
}

// 測試與本機模擬用：產生標頭內容
export function encodePrincipal({ userId, email, roles = ['anonymous', 'authenticated', 'learner'], provider = 'aad' }) {
  return Buffer.from(JSON.stringify({ identityProvider: provider, userId, userDetails: email, userRoles: roles })).toString('base64');
}
