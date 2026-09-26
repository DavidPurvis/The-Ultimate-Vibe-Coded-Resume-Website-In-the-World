/** Projects of record: name, stack and page anchor. Bullets are framings of the P-facts. */
import type { ProjectId, ProjectOfRecord } from './types';

export const PROJECTS: Record<ProjectId, ProjectOfRecord> = {
  P1: {
    id: 'P1',
    anchor: 'car-thing',
    name: 'Car Thing Media Controller',
    stack: 'Python, aiohttp, dbus-next, systemd, MPRIS',
  },
  P2: {
    id: 'P2',
    anchor: 'stream-deck',
    name: 'Stream Deck + Bring-Up on Linux',
    stack: 'USB HID, udev, PipeWire',
  },
  P3: {
    id: 'P3',
    anchor: 'homelab',
    name: 'Self-Hosted Service Infrastructure',
    stack: 'Proxmox VE, Docker, Python, CI/CD',
  },
  P4: {
    id: 'P4',
    anchor: 'dashboard',
    name: 'Match Analytics Dashboard',
    stack: 'React, REST API integration',
  },
};
