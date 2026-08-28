// Thin wrapper around fetch() for talking to the Apps Script backend.
// POST bodies are sent as text/plain on purpose -- it keeps the request a
// CORS "simple request" so the browser doesn't send a preflight OPTIONS,
// which Apps Script web apps can't answer.
const Api = {
  async get(params) {
    const url = new URL(API_URL);
    Object.keys(params || {}).forEach((k) => {
      if (params[k] !== undefined && params[k] !== null) {
        url.searchParams.set(k, params[k]);
      }
    });
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  async post(payload) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }
};
