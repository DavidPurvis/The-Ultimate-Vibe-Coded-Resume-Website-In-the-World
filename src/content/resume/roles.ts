/** Roles of record: every header detail (title, organisation, dates) lives here and only here. */
import type { RoleId, RoleOfRecord } from './types';

export const ROLES: Record<RoleId, RoleOfRecord> = {
  'aspen-sfa': {
    id: 'aspen-sfa',
    title: 'Salesforce Administrator',
    org: 'City of Aspen, Strategy & Innovation Office',
    location: 'Aspen, CO',
    dates: 'Apr 2025 – May 2026',
    start: '2025-04',
  },
  'aspen-it': {
    id: 'aspen-it',
    title: 'IT Support Specialist',
    org: 'City of Aspen',
    location: 'Aspen, CO',
    dates: 'Oct 2024 – Apr 2025',
    start: '2024-10',
  },
  rafting: {
    id: 'rafting',
    title: 'Whitewater Rafting Guide / Instructor',
    org: 'Whitewater Rafting, LLC',
    location: 'Glenwood Springs, CO',
    dates: 'May 2022 – Nov 2024 (seasonal)',
    start: '2022-05',
  },
  cspire: {
    id: 'cspire',
    title: 'Software Developer Intern, Fiber Billing',
    org: 'C Spire',
    location: 'Ridgeland, MS',
    dates: 'Jun 2021 – Jul 2021',
    start: '2021-06',
  },
};
