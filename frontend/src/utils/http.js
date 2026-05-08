export async function readJsonBody(response) {
  const text = await response.text();
  if (!text || !String(text).trim()) {
    return { json: null, parseError: false, empty: true, text: "" };
  }
  try {
    return { json: JSON.parse(text), parseError: false, empty: false, text };
  } catch (e) {
    return { json: null, parseError: true, empty: false, text };
  }
}
