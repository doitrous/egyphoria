// Reads the per-page data/strings injected by the build as JSON.
// Every page includes <script id="egy-data" type="application/json">…</script>.
const el = document.getElementById('egy-data');
export const DATA = el ? JSON.parse(el.textContent) : {};
export const { lang = 'en', dir = 'ltr', t = {}, destinations = {}, trips = [], currentTrip = null, urls = {} } = DATA;

// tiny {n}/{name} interpolation over a resolved string
export function fmt(str, vars = {}) {
  return String(str == null ? '' : str).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}
export const S = (path, vars) => {
  const val = path.split('.').reduce((o, k) => (o == null ? o : o[k]), t);
  return fmt(val ?? path, vars);
};
