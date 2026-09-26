/**
 * The ONE inline script on every page (hash-pinned in the CSP). Runs before first paint so the
 * saved mode/theme never flashes, and marks <html data-js> so JS-only blocks render in the first
 * paint (no layout shift) while staying hidden without JS. Must stay tiny, dependency-free and
 * identical on every page.
 */
export const BOOT_SCRIPT =
  "(function(){var d=document.documentElement;d.setAttribute('data-js','');try{var p=JSON.parse(localStorage.getItem('uvcr:prefs')||'{}'),q=new URLSearchParams(location.search).get('mode'),m=q==='recruiter'||q==='chaos'?q:p.mode==='recruiter'?'recruiter':'chaos',t=p.theme;d.setAttribute('data-mode',m);if(m!=='recruiter'&&t&&t!=='system'&&!(d.getAttribute('data-layout')==='resume'&&(t==='lights-out'||t==='comic')))d.setAttribute('data-theme',t)}catch(e){}})();";
