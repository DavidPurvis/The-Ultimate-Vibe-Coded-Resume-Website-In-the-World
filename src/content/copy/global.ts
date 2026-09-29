/** Shared wording for the optional overlays, display settings, threat data and notifications. */

/** Optional overlays offered in Recreation. Each loads only when switched on. */
export const modes = {
  label: 'Optional overlays',
  hud: 'Overkill HUD',
  hudHint: 'Places gaming interface elements around every edge. The middle stays readable.',
  subway: 'Attention-span assistance',
  subwayHint:
    'Adds gameplay footage in picture-in-picture players, up to 12. Footage loads only from these controls.',
};

export const themes = {
  labels: {
    light: 'Light',
    dark: 'Dark',
    darker: 'Darker',
    'lights-out': 'Lights out',
    comic: 'Light (Comic Sans)',
  },
  buttonPrefix: 'Display:',
  reset: 'Reset display',
  lightsOutHint:
    'Lights out. The light follows your pointer or your focus. Press Escape to restore the lights.',
};

/** Internal assessment level, shown only inside the optional HUD. */
export const threat = {
  label: 'Assessment level:',
  levels: ['ROUTINE', 'NOTED', 'REFERRED', 'UNDER CONTINUOUS REVIEW'],
  announce: (level: string) => `Assessment level recorded as ${level}.`,
};

export const toastCloseLabel = 'Dismiss notification';
