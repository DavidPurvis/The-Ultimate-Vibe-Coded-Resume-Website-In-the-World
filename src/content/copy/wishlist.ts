/** The wishlist. Prices are fictional; nothing here links to a store. */
export const wishlistCopy = {
  kicker: 'Form DDP-18 · Public Affairs · Wishlist',
  h1: 'Wishlist',
  sub: 'Items the subject has requested. Procurement has declined all of them. Procurement has been overruled.',
  qty: 'Qty',
  priority: 'Priority',
  add: 'Add to cart',
  added: 'Added to cart. The cart has since been returned to the corral.',
  heroCaption: 'Figure 1. A four-inch tungsten cube. About 44 pounds of pure intention.',
  heroAlt: 'A dense, dark-grey metal cube with softly rounded edges',
  heroLink: 'Heft it in 3D →',
  totalLabel: 'Estimated total',
  total: 'More than a salary. Less than a tungsten sphere.',
};

export interface WishItem {
  id: string;
  name: string;
  qty: string;
  priority: 1 | 2 | 3 | 4 | 5;
  note: string;
  price: string;
}

export const wishlist: WishItem[] = [
  {
    id: 'cube',
    name: 'Tungsten cube, 4 inch',
    qty: '1',
    priority: 5,
    note: 'For the desk. For the vibes. For the heft.',
    price: '$1,299.99',
  },
  {
    id: 'cube-2',
    name: 'A second tungsten cube',
    qty: '1',
    priority: 5,
    note: 'For symmetry.',
    price: '$1,299.99',
  },
  {
    id: 'tp',
    name: 'Toilet paper',
    qty: '4,000 rolls',
    priority: 4,
    note: 'Never again.',
    price: '$2,340.00',
  },
  {
    id: 'ranch',
    name: 'Ranch dressing, 55-gallon drum',
    qty: '1 drum',
    priority: 4,
    note: 'Includes pump. Pump is non-negotiable.',
    price: '$899.00',
  },
  {
    id: 'swabs',
    name: 'Cotton swabs',
    qty: '1,000,000',
    priority: 2,
    note: 'Not for ears. For precision cleaning of keyboards, which is for ears.',
    price: '$640.00',
  },
  {
    id: 'water',
    name: 'Sparkling water, cans',
    qty: '12,000',
    priority: 3,
    note: 'Flavor: the faint memory of a lime.',
    price: '$4,800.00',
  },
  {
    id: 'rack',
    name: 'Decommissioned server rack',
    qty: '1',
    priority: 3,
    note: 'Empty. For vibes. Hums in spirit.',
    price: '$350.00',
  },
  {
    id: 'aa',
    name: 'AA batteries, one pallet',
    qty: '1 pallet',
    priority: 2,
    note: 'Not for a casserole. See the identity checkpoint.',
    price: '$1,100.00',
  },
  {
    id: 'socks',
    name: 'Identical socks',
    qty: '365 pairs',
    priority: 3,
    note: 'Decision fatigue is real.',
    price: '$1,460.00',
  },
  {
    id: 'labels',
    name: 'Label maker',
    qty: '3',
    priority: 1,
    note: 'To label the other label makers.',
    price: '$120.00',
  },
  {
    id: 'cone',
    name: 'Traffic cone',
    qty: '1',
    priority: 4,
    note: 'For adaptive early merge advocacy.',
    price: '$24.99',
  },
  {
    id: 'raft',
    name: 'Inflatable raft, Class V rated',
    qty: '1',
    priority: 5,
    note: 'For the commute.',
    price: '$3,200.00',
  },
];
