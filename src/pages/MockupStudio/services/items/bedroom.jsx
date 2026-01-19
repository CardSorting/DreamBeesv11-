import React from 'react';

import { Icons } from '../../components/MockupIcons';

export const bedroomItems = [
  {
    id: 'duvet_cover',
    label: 'Duvet Set',
    description: 'Queen size duvet cover bedding.',
    formatSpec: 'queen size duvet cover bedding set on a bed',
    subjectNoun: 'duvet cover',
    icon: <Icons.Duvet />,
    category: 'Bedroom'
  },
  {
    id: 'pillowcase_standard',
    label: 'Pillowcase',
    description: 'Standard cotton pillowcase.',
    formatSpec: 'standard size cotton pillowcase on a pillow',
    subjectNoun: 'pillowcase',
    icon: <Icons.Pillow />,
    category: 'Bedroom'
  },
  {
    id: 'eye_mask',
    label: 'Sleep Mask',
    description: 'Silk sleep eye mask.',
    formatSpec: 'satin silk sleep eye mask with strap',
    subjectNoun: 'sleep mask',
    icon: <Icons.EyeMask />,
    category: 'Bedroom'
  },
  {
    id: 'throw_pillow',
    label: 'Throw Pillow',
    description: 'Square decorative throw pillow.',
    formatSpec: 'square decorative throw pillow on a bed',
    subjectNoun: 'throw pillow',
    icon: <Icons.Pillow />, // Using generic pillow
    category: 'Bedroom'
  },
  {
    id: 'bed_runner',
    label: 'Bed Runner',
    description: 'Decorative fabric bed scarf.',
    formatSpec: 'decorative fabric bed runner scarf draped at the foot of a bed',
    subjectNoun: 'bed runner',
    icon: <Icons.BedRunner />,
    category: 'Bedroom'
  },
  {
    id: 'alarm_clock',
    label: 'Alarm Clock',
    description: 'Modern digital bedside clock.',
    formatSpec: 'modern wooden digital alarm clock on a nightstand',
    subjectNoun: 'alarm clock',
    icon: <Icons.AlarmClock />,
    category: 'Bedroom'
  },
  {
    id: 'diffuser_bedroom',
    label: 'Reed Diffuser',
    description: 'Glass bottle scent diffuser.',
    formatSpec: 'glass bottle reed diffuser with sticks',
    subjectNoun: 'reed diffuser',
    icon: <Icons.Diffuser />,
    category: 'Bedroom'
  },
  {
    id: 'slippers',
    label: 'Slippers',
    description: 'Plush indoor house slippers.',
    formatSpec: 'pair of soft plush indoor house slippers',
    subjectNoun: 'slippers',
    icon: <Icons.Slippers />,
    category: 'Bedroom'
  },
  {
    id: 'laundry_hamper',
    label: 'Laundry Hamper',
    description: 'Fabric laundry basket.',
    formatSpec: 'canvas fabric laundry hamper basket',
    subjectNoun: 'laundry hamper',
    icon: <Icons.Hamper />,
    category: 'Bedroom'
  },
  {
    id: 'bed_sheet',
    label: 'Bed Sheet',
    description: 'Flat top bed sheet texture.',
    formatSpec: 'flat cotton bed sheet fabric texture',
    subjectNoun: 'bed sheet',
    icon: <Icons.Duvet />, // Similar vibe
    category: 'Bedroom'
  }
];