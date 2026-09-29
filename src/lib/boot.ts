/**
 * The one inline script per page (hash-pinned in that page's CSP). It runs before first paint and
 * must stay tiny and dependency-free.
 *
 * BOOT_SITE marks <html data-js> (JS-only blocks render in the first paint, hidden without JS),
 * and applies the saved mode (Direct access) and display setting so neither flashes. The sincere
 * tribute (data-plain) and Direct access never take a novelty theme.
 *
 * BOOT_RESUME only marks data-js. The résumé never reads storage: it has no novelty theme, no case
 * and no mode, whatever the visitor chose elsewhere.
 */
export const BOOT_SITE =
  "(function(){var d=document.documentElement;d.setAttribute('data-js','');try{var p=JSON.parse(localStorage.getItem('uvcr:prefs')||'{}'),q=new URLSearchParams(location.search).get('mode'),m=q==='recruiter'||q==='chaos'?q:p.mode==='recruiter'?'recruiter':'chaos',t=p.theme;d.setAttribute('data-mode',m);if(m!=='recruiter'&&!d.hasAttribute('data-plain')&&/^(light|dark|darker|lights-out|comic)$/.test(t))d.setAttribute('data-theme',t)}catch(e){}})();";

export const BOOT_RESUME = "document.documentElement.setAttribute('data-js','');";
