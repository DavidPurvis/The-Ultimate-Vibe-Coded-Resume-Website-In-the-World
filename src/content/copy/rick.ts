/** Consensual rickrolls. No lyrics anywhere, by design. */
export const RICK_VIDEO_ID = 'dQw4w9WgXcQ';
export const RICK_EMBED = `https://www.youtube-nocookie.com/embed/${RICK_VIDEO_ID}?autoplay=1&playsinline=1&rel=0`;
export const RICK_WATCH = `https://www.youtube.com/watch?v=${RICK_VIDEO_ID}`;

export const rickDialog = {
  title: 'Mandatory Musical Due Diligence',
  body: 'If nothing is happening, press play. This is a consensual rickroll.',
  iframeTitle: 'Rick Astley — Never Gonna Give You Up (official video, embedded from YouTube)',
  continue: 'Continue to where you were going →',
  close: 'Close',
  closeLabel: 'Close musical due diligence',
  notLoading: 'Video not loading?',
  fallback: 'The video has been removed, much like my dignity.',
  fallbackAlt: 'An anonymous dancer, standing in for a video that could not load',
  watch: 'Watch it on YouTube ↗',
};

export const rickPage = {
  kicker: 'FORM DRV-14 · MANDATORY MUSICAL DUE DILIGENCE',
  h1: 'Mandatory Musical Due Diligence',
  body: 'Every candidate file is subject to musical due diligence. This is a consensual rickroll. Nothing plays until you press the button.',
  begin: 'Begin due diligence',
  skip: 'Skip to the case files →',
};

export const decoyPage = {
  heading: (n: number, title: string) => `Case File DRV-15/${n}: ${title}`,
  body: 'Access requires musical due diligence.',
  begin: 'Begin due diligence',
  skip: 'Skip to the actual case file →',
};
