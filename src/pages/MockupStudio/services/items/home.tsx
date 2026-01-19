import React from 'react';
import { MockupItem } from '../../types';
import { Icons } from '../../components/MockupIcons';

export const homeItems: MockupItem[] = [
  {
    id: 'mug',
    label: 'Mug',
    description: '11oz white ceramic coffee mug.',
    formatSpec: '11oz white ceramic coffee mug',
    subjectNoun: 'coffee mug',
    icon: <Icons.Mug />,
    category: 'Home'
  },
  {
    id: 'tumbler',
    label: 'Tumbler',
    description: 'Stainless steel travel tumbler.',
    formatSpec: 'stainless steel travel tumbler with straw',
    subjectNoun: 'tumbler',
    icon: <Icons.Tumbler />,
    category: 'Home'
  },
  {
    id: 'water_bottle',
    label: 'Water Bottle',
    description: 'Aluminum sports water bottle.',
    formatSpec: 'aluminum sports water bottle',
    subjectNoun: 'water bottle',
    icon: <Icons.WaterBottle />,
    category: 'Home'
  },
  {
    id: 'coaster',
    label: 'Coaster',
    description: 'Round cork drink coaster.',
    formatSpec: 'round cork drink coaster',
    subjectNoun: 'cork coaster',
    icon: <Icons.Coaster />,
    category: 'Home'
  },
  {
    id: 'glass_cup',
    label: 'Glass Cup',
    description: '16oz can-shaped glass cup.',
    formatSpec: '16oz can-shaped glass cup',
    subjectNoun: 'glass cup',
    icon: <Icons.GlassCup />,
    category: 'Home'
  },
  {
    id: 'mousepad',
    label: 'Mousepad',
    description: 'Standard 9x8 inch fabric mousepad.',
    formatSpec: 'standard rectangular fabric mousepad',
    subjectNoun: 'mousepad',
    icon: <Icons.Mousepad />,
    category: 'Home'
  },
  {
    id: 'desk_mat',
    label: 'Desk Mat',
    description: 'Large extended desk mousepad.',
    formatSpec: 'large extended desk mat mousepad',
    subjectNoun: 'desk mat',
    icon: <Icons.DeskMat />,
    category: 'Home'
  },
  {
    id: 'playmat',
    label: 'Playmat',
    description: 'Large 24x14 inch desk/game mat.',
    formatSpec: '24x14 inch desk playmat',
    subjectNoun: 'playmat',
    icon: <Icons.Playmat />,
    category: 'Home'
  },
  {
    id: 'yoga_mat',
    label: 'Yoga Mat',
    description: 'Rolled foam yoga exercise mat.',
    formatSpec: 'rolled foam yoga exercise mat',
    subjectNoun: 'yoga mat',
    icon: <Icons.YogaMat />,
    category: 'Home'
  },
  {
    id: 'blanket',
    label: 'Blanket',
    description: 'Soft plush fleece throw blanket.',
    formatSpec: 'soft plush fleece throw blanket',
    subjectNoun: 'fleece blanket',
    icon: <Icons.Blanket />,
    category: 'Home'
  },
  {
    id: 'candle',
    label: 'Candle',
    description: 'Glass jar soy wax candle.',
    formatSpec: 'glass jar scented candle',
    subjectNoun: 'candle jar',
    icon: <Icons.Candle />,
    category: 'Home'
  },
  {
    id: 'body_pillow',
    label: 'Body Pillow',
    description: 'Long Dakimakura body pillow.',
    formatSpec: 'long dakimakura body pillow',
    subjectNoun: 'body pillow',
    icon: <Icons.BodyPillow />,
    category: 'Home'
  },
  {
    id: 'koozie',
    label: 'Koozie',
    description: 'Foam can cooler sleeve.',
    formatSpec: 'foam drink koozie can cooler',
    subjectNoun: 'koozie',
    icon: <Icons.Koozie />,
    category: 'Home'
  }
];