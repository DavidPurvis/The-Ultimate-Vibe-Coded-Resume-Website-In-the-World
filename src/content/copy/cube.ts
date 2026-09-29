/** The Tungsten Cube Experience (/cube/). Physics is real; the GPU load unit is not. */
export const cubeCopy = {
  kicker: 'Form DDP-19 · Recreation · Tungsten cube',
  h1: 'The Tungsten Cube',
  lede: 'Item one on the wishlist, rendered in physically based metal. Drag to orbit. Scroll or pinch to zoom.',
  canvasLabel: 'A four-inch tungsten cube on the floor. Drag to orbit, scroll to zoom.',
  fallbackAlt: 'A drawing of a four-inch tungsten cube',
  heft: 'Heft it',
  summon: (n: string, max: string) => `Summon 1,000 more cubes (${n} / ${max})`,
  full: 'The floor has filed a complaint.',
  clear: 'Clear the floor',
  thud: 'Thud.',
  calmThud: 'Thud. (Reduced motion: the Department felt it for you.)',
  loading: 'Loading tungsten…',
  noWebgl:
    'Your browser declined to render tungsten. The drawing is to scale, emotionally, and the specifications below still apply.',
  specsTitle: 'Specifications',
  specs: (kg: string, lb: string) => [
    ['Edge', '4 in (10.16 cm)'],
    ['Mass', `${kg} kg (${lb} lb)`],
    ['Density', '19.3 g/cm³'],
    ['GPU load', '19.3 g/cm³'],
    ['Atomic number', 'Redacted. It contains a 7.'],
    ['Purpose', 'None. That’s the point.'],
  ],
  onFloor: (n: string) => `Cubes on the floor: ${n}.`,
  faqTitle: 'Frequently asked questions',
  faq: [
    ['Is it heavy?', 'Yes. Heavier than it looks, which is the entire product.'],
    ['Why?', 'You don’t buy a tungsten cube. You become someone who has one.'],
    [
      'Is this a good use of WebGL?',
      'It is the best use of WebGL. The shading is physically based and lit by a room the code builds for itself.',
    ],
  ],
};
