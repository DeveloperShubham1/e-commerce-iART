
export const loadCheckoutState = (key) => {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveCheckoutState = (key, state) => {
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    
  }
};

export const clearCheckoutState = (key) => {
  if (!key) return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // no-op
  }
};