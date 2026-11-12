// Adapted from Vencord ClearURLs
// https://github.com/Vendicated/Vencord/blob/main/src/plugins/clearURLs/index.ts

import { defaultRules } from './clearUrlsDefaultRules';

function escapeRegExp(str: string): string {
  const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  const reHasRegExpChar = RegExp(reRegExpChar.source);

  return str && reHasRegExpChar.test(str) ? str.replace(reRegExpChar, '\\$&') : str || '';
}

const universalRules = new Set<RegExp>();
const rulesByHost = new Map<string, Set<RegExp>>();
const hostRules = new Map<string, RegExp>();

function parseRule(rule: string): void {
  const [rawParamRule, rawHostRule] = rule.split('@');
  const paramRuleRegexInner = escapeRegExp(rawParamRule).replace(/\\\*/g, '.+?');
  const paramRule = new RegExp(`^${paramRuleRegexInner}$`);

  if (!rawHostRule) {
    universalRules.add(paramRule);
    return;
  }

  const hostRuleRegexInner = escapeRegExp(rawHostRule)
    .replace(/\\\./g, '\\.')
    .replace(/^\\\*\\\./, '(.+?\\.)?')
    .replace(/\\\*/g, '.+?');
  const hostRule = new RegExp(`^(www\\.)?${hostRuleRegexInner}$`);
  const hostRuleIndex = hostRule.toString();

  hostRules.set(hostRuleIndex, hostRule);
  let hostSet = rulesByHost.get(hostRuleIndex);
  if (!hostSet) {
    hostSet = new Set<RegExp>();
    rulesByHost.set(hostRuleIndex, hostSet);
  }
  hostSet.add(paramRule);
}

defaultRules.forEach(parseRule);

/** Strip known tracking query parameters from a single HTTP(S) URL. */
export function clearUrl(match: string): string {
  let url: URL;
  try {
    url = new URL(match);
  } catch {
    return match;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return match;
  }

  if (url.searchParams.entries().next().done) {
    return match;
  }

  const applicableRules: RegExp[] = [];
  universalRules.forEach((rule) => applicableRules.push(rule));

  hostRules.forEach((regex, hostRuleName) => {
    if (!regex.test(url.hostname)) return;
    rulesByHost.get(hostRuleName)?.forEach((rule) => applicableRules.push(rule));
  });

  // Collect keys before deleting so iteration over searchParams cannot skip keys.
  const keys = Array.from(new Set(url.searchParams.keys()));
  let changed = false;
  keys.forEach((param) => {
    if (applicableRules.some((rule) => rule.test(param))) {
      url.searchParams.delete(param);
      changed = true;
    }
  });

  return changed ? url.toString() : match;
}

/** Strip tracking parameters from all HTTP(S) anchor hrefs inside an HTML fragment. */
export function clearUrlsFromHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html;
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  const links = container.getElementsByTagName('a');
  for (let i = 0; i < links.length; i += 1) {
    const link = links[i];
    const href = link.getAttribute('href');
    if (href) {
      link.setAttribute('href', clearUrl(href));
    }
  }
  return container.innerHTML;
}

/** Strip tracking parameters from HTTP(S) URLs embedded in plain text. */
export function clearUrlsFromText(text: string): string {
  const regex = /https?:\/\/[^\s<]+[^<.,:;"'>)|\]!\s]/g;
  return text.replace(regex, (match) => clearUrl(match));
}
