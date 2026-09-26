/**
 * The one inline script per page (hash-pinned in that page's CSP). It runs before first paint and
 * must stay tiny and dependency-free.
 *
 * BOOT_SITE marks <html data-js> (JS-only blocks render in the first paint, hidden without JS) and
 * copies the case hint from sessionStorage into data-case, so a reload mid-case paints the right
 * static block. The legacy mode/theme part serves the old gag pages until they are removed.
 *
 * BOOT_RESUME only marks data-js. The résumé never reads the case: it has no storage access at all.
 */
export const BOOT_SITE =
  "(function(){var d=document.documentElement;d.setAttribute('data-js','');try{var c=JSON.parse(sessionStorage.getItem('uvcr:case')||'null');if(c&&c.v===2&&(c.hint==='open'||c.hint==='closed'))d.setAttribute('data-case',c.hint)}catch(e){}try{var p=JSON.parse(localStorage.getItem('uvcr:prefs')||'{}'),q=new URLSearchParams(location.search).get('mode'),m=q==='recruiter'||q==='chaos'?q:p.mode==='recruiter'?'recruiter':'chaos',t=p.theme;d.setAttribute('data-mode',m);if(m!=='recruiter'&&t&&t!=='system')d.setAttribute('data-theme',t)}catch(e){}})();";

export const BOOT_RESUME = "document.documentElement.setAttribute('data-js','');";
