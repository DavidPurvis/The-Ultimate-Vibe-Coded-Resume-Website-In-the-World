/**
 * The ONE inline script on every page (hash-pinned in the CSP). Runs before first paint so the
 * saved mode/theme never flashes. Must stay tiny, dependency-free and identical on every page.
 */
export const BOOT_SCRIPT =
  "(function(){try{var d=document.documentElement,p=JSON.parse(localStorage.getItem('uvcr:prefs')||'{}'),q=new URLSearchParams(location.search).get('mode'),m=q==='recruiter'||q==='chaos'?q:p.mode==='recruiter'?'recruiter':'chaos',t=p.theme;d.setAttribute('data-mode',m);if(m!=='recruiter'&&t&&t!=='system'&&!(d.getAttribute('data-layout')==='resume'&&(t==='lights-out'||t==='comic')))d.setAttribute('data-theme',t)}catch(e){}})();";
