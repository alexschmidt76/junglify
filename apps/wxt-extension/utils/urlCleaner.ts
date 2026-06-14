/**
 * Turns a raw URL into a stable "content key" that Junglify uses to decide
 * whether two URLs point at meaningfully different pages.
 *
 * Junglify only cares about the parts of a URL that change *what's on the page*
 * — the host, the path, and content-bearing query params such as a public
 * profile id (`?user=42`), a search query (`?q=...`) or a page number
 * (`?page=2`). It deliberately throws away "how you got here" noise: campaign /
 * tracking params, share & referrer tags, scroll anchors and video timestamps.
 *
 * Two requests that show the same content should clean to the same string;
 * two requests that show different content should stay distinct.
 *
 * @example
 * cleanUrl('https://www.youtube.com/watch?v=abc&t=120s&si=xyz&feature=share')
 *   // -> 'https://youtube.com/watch?v=abc'
 * cleanUrl('https://Example.com/Profile/?utm_source=news&id=7#bio')
 *   // -> 'https://example.com/Profile?id=7'
 */

/**
 * Param-name *prefixes* that mark whole families of tracking keys. Anything
 * starting with one of these is junk on every site. Compared lower-case.
 */
const JUNK_PARAM_PREFIXES = [
  'utm_', // Google / generic campaign tracking (utm_source, utm_medium, ...)
  'pk_', // Piwik / Matomo
  'mtm_', // Matomo (newer)
  'piwik_',
  'matomo_',
  'hsa_', // HubSpot ads
] as const;

/**
 * High-confidence junk params, safe to strip regardless of host. These are
 * analytics / click / share identifiers that never change page content.
 * Compared lower-case.
 */
const GLOBAL_JUNK_PARAMS = new Set<string>([
  // click identifiers
  'gclid',
  'gclsrc',
  'dclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'yclid',
  'twclid',
  'igshid',
  'ttclid',
  'li_fat_id',
  'rdt_cid',
  // email / newsletter tracking
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'vero_id',
  'vero_conv',
  'oly_anon_id',
  'oly_enc_id',
  'mkt_tok',
  // referral / share / source attribution
  'ref',
  'ref_src',
  'ref_url',
  'referrer',
  'referer',
  'source',
  'cmpid',
  'campaign',
  '_ga',
  '_gl',
]);

/**
 * Ambiguous params that only count as junk on specific hosts (e.g. `t` is a
 * video timestamp on YouTube but could be real content elsewhere, and `start`
 * is a pagination offset on many sites so it must NOT be globally stripped).
 *
 * Keys are registrable-ish hostnames; a rule applies to that host and any
 * subdomain of it. Param names are compared lower-case.
 */
const HOST_JUNK_PARAMS: Record<string, readonly string[]> = {
  'youtube.com': ['t', 'si', 'feature', 'pp', 'ab_channel'],
  'youtu.be': ['t', 'si'],
  'x.com': ['s', 't'],
  'twitter.com': ['s', 't'],
  'amazon.com': ['psc', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg', 'pf_rd_p', 'pf_rd_r'],
  'spotify.com': ['si'],
};

/** True when `hostname` is `ruleHost` or a subdomain of it. */
function hostMatches(hostname: string, ruleHost: string): boolean {
  return hostname === ruleHost || hostname.endsWith(`.${ruleHost}`);
}

/** Decide whether a query param is junk for the given host. */
function isJunkParam(name: string, hostname: string): boolean {
  const key = name.toLowerCase();

  if (GLOBAL_JUNK_PARAMS.has(key)) return true;
  if (JUNK_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix))) return true;

  for (const [ruleHost, params] of Object.entries(HOST_JUNK_PARAMS)) {
    if (hostMatches(hostname, ruleHost) && params.includes(key)) return true;
  }

  return false;
}

/**
 * Normalise a raw URL into its Junglify content key.
 *
 * Returns the cleaned URL string. If the input can't be parsed as a URL it is
 * returned trimmed and unchanged, so callers always get a usable key.
 */
export function cleanUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl.trim();
  }

  // Collapse http/https — the same page over either scheme is the same content.
  const scheme = url.protocol === 'http:' ? 'https:' : url.protocol;

  // Lower-case the host and drop a leading `www.` (cosmetic, not content).
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  const host = url.port ? `${hostname}:${url.port}` : hostname;

  // Drop a trailing slash so `/foo` and `/foo/` are treated as one page,
  // but keep the root path `/` intact.
  let path = url.pathname;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

  // Keep only content-bearing params, drop empty values, and sort for a
  // stable key regardless of the order params arrived in.
  const cleaned = new URLSearchParams();
  for (const [name, value] of url.searchParams.entries()) {
    if (value === '' || isJunkParam(name, hostname)) continue;
    cleaned.append(name, value);
  }
  cleaned.sort();

  const query = cleaned.toString();

  // The fragment (`#...`) is intentionally dropped — it's almost always a
  // scroll anchor or timestamp rather than a distinct page.
  return `${scheme}//${host}${path}${query ? `?${query}` : ''}`;
}

export default cleanUrl;
