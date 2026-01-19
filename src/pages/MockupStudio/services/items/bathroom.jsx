import React from 'react';

import { Icons } from '../../components/MockupIcons';

export const bathroomItems = [
  {
    id: 'bath_towel',
    label: 'Bath Towel',
    description: 'Folded fluffy cotton bath towel.',
    formatSpec: 'soft folded cotton bath towel stack',
    subjectNoun: 'bath towel',
    icon: <Icons.BathTowel />,
    category: 'Bathroom'
  },
  {
    id: 'hand_towel',
    label: 'Hand Towel',
    description: 'Hanging bathroom hand towel.',
    formatSpec: 'bathroom hand towel hanging on a ring',
    subjectNoun: 'hand towel',
    icon: <Icons.BathTowel />, // Reusing icon
    category: 'Bathroom'
  },
  {
    id: 'shower_curtain',
    label: 'Shower Curtain',
    description: 'Fabric shower curtain pattern.',
    formatSpec: 'fabric shower curtain hanging on a rod',
    subjectNoun: 'shower curtain',
    icon: <Icons.ShowerCurtain />,
    category: 'Bathroom'
  },
  {
    id: 'bath_mat',
    label: 'Bath Mat',
    description: 'Plush bathroom floor mat.',
    formatSpec: 'plush tufted bathroom floor mat rug',
    subjectNoun: 'bath mat',
    icon: <Icons.BathMat />,
    category: 'Bathroom'
  },
  {
    id: 'soap_dispenser',
    label: 'Soap Dispenser',
    description: 'Ceramic liquid soap pump bottle.',
    formatSpec: 'ceramic liquid soap dispenser pump bottle',
    subjectNoun: 'soap dispenser',
    icon: <Icons.SoapDispenser />,
    category: 'Bathroom'
  },
  {
    id: 'toothbrush_holder',
    label: 'Toothbrush Cup',
    description: 'Ceramic holder for toothbrushes.',
    formatSpec: 'ceramic toothbrush holder cup',
    subjectNoun: 'toothbrush holder',
    icon: <Icons.ToothbrushHolder />,
    category: 'Bathroom'
  },
  {
    id: 'bath_bomb',
    label: 'Bath Bomb',
    description: 'Round fizzy bath bomb.',
    formatSpec: 'round textured bath bomb',
    subjectNoun: 'bath bomb',
    icon: <Icons.BathBomb />,
    category: 'Bathroom'
  },
  {
    id: 'bathroom_scale',
    label: 'Digital Scale',
    description: 'Glass digital bathroom body scale.',
    formatSpec: 'tempered glass digital bathroom body scale',
    subjectNoun: 'bathroom scale',
    icon: <Icons.Scale />,
    category: 'Bathroom'
  },
  {
    id: 'loofah',
    label: 'Bath Loofah',
    description: 'Mesh bath sponge pouf.',
    formatSpec: 'mesh bath loofah sponge pouf with string',
    subjectNoun: 'loofah',
    icon: <Icons.Loofah />,
    category: 'Bathroom'
  },
  {
    id: 'toiletry_bag',
    label: 'Toiletry Bag',
    description: 'Waterproof zippered wash bag.',
    formatSpec: 'waterproof zippered hanging toiletry wash bag',
    subjectNoun: 'wash bag',
    icon: <Icons.TechPouch />, // Similar shape
    category: 'Bathroom'
  }
];