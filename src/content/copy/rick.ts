/** Musical material, played only on request. No lyrics anywhere, by design. */
export const RICK_VIDEO_ID = 'dQw4w9WgXcQ';
export const RICK_EMBED = `https://www.youtube-nocookie.com/embed/${RICK_VIDEO_ID}?autoplay=1&playsinline=1&rel=0`;
export const RICK_WATCH = `https://www.youtube.com/watch?v=${RICK_VIDEO_ID}`;

export const rickDialog = {
  title: 'Musical Material',
  body: 'If nothing is playing, press play in the player.',
  iframeTitle: 'Rick Astley — Never Gonna Give You Up (official video, embedded from YouTube)',
  continue: 'Return to the requested page',
  close: 'Close',
  closeLabel: 'Close musical material',
  notLoading: 'Video not loading?',
  fallback: 'The video could not be retrieved. A substitute has been filed.',
  fallbackAlt: 'An anonymous dancer, standing in for a video that could not load',
  watch: 'Watch it on YouTube ↗',
};

export const rickPage = {
  kicker: 'Form DDP-14 · Recreation · Musical material',
  h1: 'Musical Material',
  body: 'Musical material is retained on file. Nothing plays until you press the button, and it stops when you close the player.',
  begin: 'Play the material on file',
  skip: 'Return to the directory',
};

export const decoyPage = {
  heading: (n: number, title: string) => `Case File DDP-15/${n}: ${title}`,
  body: 'This file is released with musical material. The material plays only if you press the button.',
  begin: 'Play the material and open the file',
  skip: 'Open the file without music',
};
