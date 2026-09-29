/**
 * The departmental directory: six categories of service. These are organizational groups, not
 * stages; nothing here must be visited before anything else. The homepage, the header menu and
 * each page's "related offices" all read from this one list.
 */
import type { CategoryId } from '../../case/policy';

export interface Service {
  label: string;
  /** Root-relative path, when the service is a page. */
  path?: string;
  /** A control on the homepage instead of a page (the id of that control's section). */
  control?: 'classification' | 'overlays' | 'display' | 'cookies' | 'direct-access' | 'ads';
  description: string;
}

export interface Category {
  id: CategoryId;
  title: string;
  description: string;
  services: readonly Service[];
}

export const DIRECTORY: readonly Category[] = [
  {
    id: 'visitor-services',
    title: 'Visitor Services',
    description: 'Classification and verification of visitors.',
    services: [
      {
        label: 'Classification',
        control: 'classification',
        description: 'Declare what you are. Declarations are accepted as made.',
      },
      {
        label: 'Verification',
        path: '/verify/',
        description: 'Select every image that contains a window.',
      },
    ],
  },
  {
    id: 'records',
    title: 'Records',
    description: 'The file on David Purvis, held in several formats.',
    services: [
      {
        label: 'Character Review',
        path: '/about/',
        description: 'Ordinary qualities, independently reviewed. One finding is on record.',
      },
      {
        label: 'Personnel File',
        path: '/personnel-file/',
        description: 'Aliases, credentials and standing instructions.',
      },
      {
        label: 'Skills',
        path: '/skills/',
        description: 'Technical skills, issued as an equipment loadout.',
      },
      {
        label: 'Projects',
        path: '/projects/',
        description: 'Things David built because he wanted them to exist.',
      },
      {
        label: 'Newsletter',
        path: '/blog/',
        description: 'Articles on traffic, national security and goldfish.',
      },
      {
        label: 'Résumé selection',
        path: '/tailor/',
        description: 'A short questionnaire that selects the résumé for your role.',
      },
    ],
  },
  {
    id: 'correspondence',
    title: 'Correspondence',
    description: 'Contacting David, and reaching his other addresses.',
    services: [
      {
        label: 'Contact instruments',
        path: '/contact/',
        description: 'Instruments for preparing a telephone number and an email address.',
      },
      {
        label: 'Hyperlink allocation',
        path: '/casino/',
        description: 'Links to GitHub, LinkedIn, email and the PDF, allocated on request.',
      },
    ],
  },
  {
    id: 'public-affairs',
    title: 'Public Affairs',
    description: 'Positions, causes, requests and statements issued on David’s behalf.',
    services: [
      {
        label: 'Research',
        path: '/beliefs/',
        description: 'Positions held, as reviewed by two members of his CS2 team.',
      },
      { label: 'Causes', path: '/support/', description: 'Endorsed. Unfunded.' },
      {
        label: 'Wishlist',
        path: '/wishlist/',
        description: 'Items under procurement review, beginning with a tungsten cube.',
      },
      {
        label: 'Public statement',
        path: '/nintendo/',
        description: 'A preemptive letter to Nintendo’s legal department.',
      },
      {
        label: 'Data sale application',
        path: '/sell-your-data/',
        description: 'Sell your data at no charge. Nothing is stored or sent.',
      },
      {
        label: 'Self-assessment',
        path: '/confess/',
        description: 'Insider trading anxiety, self-assessed. Answers go nowhere.',
      },
    ],
  },
  {
    id: 'recreation',
    title: 'Recreation',
    description: 'Facilities for rest between procedures.',
    services: [
      {
        label: 'DOOM',
        path: '/doom/',
        description: 'Shareware episode 1. Loaded only when you press Play.',
      },
      {
        label: 'Tungsten cube',
        path: '/cube/',
        description: 'Four inches, rendered at full density.',
      },
      {
        label: 'Résumé.ppt',
        path: '/presentation/',
        description: 'The résumé, as presented in 1998.',
      },
      {
        label: 'Musical material',
        path: '/rick/',
        description: 'On file. Nothing plays until you press the button.',
      },
      {
        label: 'Optional overlays',
        control: 'overlays',
        description: 'Gaming interface and gameplay footage, if requested.',
      },
      {
        label: 'Advertising archive',
        control: 'ads',
        description: 'Advertisements previously displayed, retained for reference.',
      },
    ],
  },
  {
    id: 'facilities',
    title: 'Facilities',
    description: 'Settings, disclosures and technical documentation.',
    services: [
      {
        label: 'Display settings',
        control: 'display',
        description: 'Light, dark and other presentations.',
      },
      {
        label: 'Direct access',
        control: 'direct-access',
        description: 'Suspends every procedure. Every page stays available.',
      },
      {
        label: 'Cookie administration',
        control: 'cookies',
        description: 'Preferences, partners and certificates.',
      },
      {
        label: 'Privacy',
        path: '/privacy/',
        description: 'What is stored in your browser, and a button to clear it.',
      },
      {
        label: 'Terms of reading',
        path: '/legal/',
        description: 'The terms under which these pages may be read.',
      },
      {
        label: 'Credits',
        path: '/credits/',
        description: 'Fonts, icons, libraries and art, with licences.',
      },
      {
        label: 'How it was built',
        path: '/how-it-was-built/',
        description: 'Technical documentation.',
      },
    ],
  },
];

/** The category a page's path belongs to (for its related offices). */
export function categoryOfPath(path: string): Category | null {
  const p = path.startsWith('/blog/') ? '/blog/' : path;
  return DIRECTORY.find((c) => c.services.some((s) => s.path === p)) ?? null;
}

export const directory = {
  heading: 'Directory',
  lede: 'Services are listed by category. They may be used in any order.',
};
