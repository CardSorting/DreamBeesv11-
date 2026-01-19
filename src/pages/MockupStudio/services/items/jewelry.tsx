import React from 'react';
import { MockupItem } from '../../types';
import { Icons } from '../../components/MockupIcons';

export const jewelryItems: MockupItem[] = [
  {
    id: 'necklace_box',
    label: 'Necklace Box',
    description: 'Elegant velvet necklace box.',
    formatSpec: 'open velvet necklace box showing the interior lining',
    subjectNoun: 'necklace box',
    icon: <Icons.JewelryBox />,
    category: 'Jewelry'
  },
  {
    id: 'diamond_ring',
    label: 'Diamond Ring',
    description: 'Solitaire diamond engagement ring.',
    formatSpec: 'luxury diamond solitaire engagement ring',
    subjectNoun: 'diamond ring',
    icon: <Icons.DiamondRing />,
    category: 'Jewelry'
  },
  {
    id: 'gold_ring',
    label: 'Gold Ring',
    description: 'Gold band ring on surface.',
    formatSpec: 'gold band ring',
    subjectNoun: 'gold ring',
    icon: <Icons.Ring />,
    category: 'Jewelry'
  },
  {
    id: 'pendant_necklace',
    label: 'Pendant',
    description: 'Silver chain with pendant.',
    formatSpec: 'silver chain necklace with a blank round pendant',
    subjectNoun: 'pendant necklace',
    icon: <Icons.Necklace />,
    category: 'Jewelry'
  },
  {
    id: 'pearl_necklace',
    label: 'Pearl Necklace',
    description: 'Classic pearl strand necklace.',
    formatSpec: 'classic white pearl strand necklace',
    subjectNoun: 'pearl necklace',
    icon: <Icons.PearlNecklace />,
    category: 'Jewelry'
  },
  {
    id: 'dog_tag',
    label: 'Dog Tag',
    description: 'Metal dog tag necklace.',
    formatSpec: 'silver metal military style dog tag necklace',
    subjectNoun: 'dog tag',
    icon: <Icons.DogTag />,
    category: 'Jewelry'
  },
  {
    id: 'earring_card',
    label: 'Earring Card',
    description: 'Paper display card for earrings.',
    formatSpec: 'paper jewelry display card for earrings',
    subjectNoun: 'earring card',
    icon: <Icons.Earrings />,
    category: 'Jewelry'
  },
  {
    id: 'bracelet',
    label: 'Chain Bracelet',
    description: 'Chain bracelet on cushion.',
    formatSpec: 'metal chain bracelet displayed on a jewelry cushion',
    subjectNoun: 'bracelet',
    icon: <Icons.Bracelet />,
    category: 'Jewelry'
  },
  {
    id: 'bangle',
    label: 'Bangle',
    description: 'Solid metal bangle bracelet.',
    formatSpec: 'solid polished metal bangle bracelet',
    subjectNoun: 'bangle bracelet',
    icon: <Icons.Bangle />,
    category: 'Jewelry'
  },
  {
    id: 'classic_watch',
    label: 'Wrist Watch',
    description: 'Classic analog wrist watch.',
    formatSpec: 'classic analog wrist watch face',
    subjectNoun: 'wrist watch',
    icon: <Icons.Watch />,
    category: 'Jewelry'
  },
  {
    id: 'cufflinks',
    label: 'Cufflinks',
    description: 'Pair of metal cufflinks.',
    formatSpec: 'pair of metal cufflinks',
    subjectNoun: 'cufflinks',
    icon: <Icons.Cufflinks />,
    category: 'Jewelry'
  },
  {
    id: 'brooch',
    label: 'Brooch',
    description: 'Decorative lapel brooch pin.',
    formatSpec: 'ornate metal jewelry brooch pin',
    subjectNoun: 'brooch',
    icon: <Icons.Brooch />,
    category: 'Jewelry'
  },
  {
    id: 'jewelry_pouch',
    label: 'Velvet Pouch',
    description: 'Drawstring jewelry pouch.',
    formatSpec: 'soft velvet drawstring jewelry pouch',
    subjectNoun: 'velvet pouch',
    icon: <Icons.JewelryPouch />,
    category: 'Jewelry'
  }
];