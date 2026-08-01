// Safe localStorage wrapper — handles Safari Private Browsing on iOS/iPad
// where localStorage access throws a SecurityError

let _mem = null;

function getStore() {
  try {
    window.localStorage.setItem('__ls_test__', '1');
    window.localStorage.removeItem('__ls_test__');
    return window.localStorage;
  } catch (e) {
    if (!_mem) _mem = new Map();
    return {
      getItem: (k) => _mem.get(k) ?? null,
      setItem: (k, v) => _mem.set(k, String(v)),
      removeItem: (k) => _mem.delete(k),
    };
  }
}

export const safeStorage = {
  getItem: (key) => {
    try { return getStore().getItem(key); } catch (e) { return null; }
  },
  setItem: (key, value) => {
    try { getStore().setItem(key, value); } catch (e) {}
  },
  removeItem: (key) => {
    try { getStore().removeItem(key); } catch (e) {}
  },
};