import React from 'react';
import { MockupItem } from '../../types';
import { Icons } from '../../components/MockupIcons';

export const acrylicItems: MockupItem[] = [
  {
    id: 'acrylic_standee',
    label: 'Acrylic Standee',
    description: 'Custom character standee with base.',
    formatSpec: 'clear acrylic character standee on a base',
    subjectNoun: 'acrylic standee',
    icon: <Icons.AcrylicStandee />,
    category: 'Acrylic'
  },
  {
    id: 'acrylic_charm',
    label: 'Clear Charm',
    description: 'Clear acrylic keychain charm.',
    formatSpec: 'clear acrylic keychain charm with metal clasp',
    subjectNoun: 'acrylic charm',
    icon: <Icons.AcrylicCharm />,
    category: 'Acrylic'
  },
  {
    id: 'holo_charm',
    label: 'Holographic Charm',
    description: 'Broken glass holographic charm.',
    formatSpec: 'holographic acrylic keychain charm with broken glass effect',
    subjectNoun: 'holographic charm',
    icon: <Icons.AcrylicCharm />,
    category: 'Acrylic'
  },
  {
    id: 'acrylic_shaker',
    label: 'Shaker Charm',
    description: 'Thick acrylic shaker with loose bits.',
    formatSpec: 'thick acrylic shaker charm with loose moving pieces inside',
    subjectNoun: 'shaker charm',
    icon: <Icons.AcrylicShaker />,
    category: 'Acrylic'
  },
  {
    id: 'hotel_key_tag',
    label: 'Hotel Key Tag',
    description: 'Retro diamond shaped key tag.',
    formatSpec: 'retro diamond shaped acrylic hotel key tag',
    subjectNoun: 'motel key tag',
    icon: <Icons.HotelKeyTag />,
    category: 'Acrylic'
  },
  {
    id: 'acrylic_pin',
    label: 'Acrylic Pin',
    description: 'Printed acrylic pin with epoxy dome.',
    formatSpec: 'printed acrylic pin badge with epoxy dome finish',
    subjectNoun: 'acrylic pin',
    icon: <Icons.AcrylicPin />,
    category: 'Acrylic'
  },
  {
    id: 'acrylic_magnet',
    label: 'Acrylic Magnet',
    description: 'Die-cut clear acrylic magnet.',
    formatSpec: 'die-cut clear acrylic fridge magnet',
    subjectNoun: 'acrylic magnet',
    icon: <Icons.AcrylicPin />, // Reusing similar shape icon
    category: 'Acrylic'
  },
  {
    id: 'cake_topper',
    label: 'Cake Topper',
    description: 'Laser cut acrylic cake decoration.',
    formatSpec: 'laser cut acrylic cake topper stuck into a cake',
    subjectNoun: 'cake topper',
    icon: <Icons.CakeTopper />,
    category: 'Acrylic'
  },
  {
    id: 'acrylic_ornament',
    label: 'Ornament',
    description: 'Clear round holiday ornament.',
    formatSpec: 'clear round acrylic holiday ornament hanging from a ribbon',
    subjectNoun: 'acrylic ornament',
    icon: <Icons.AcrylicOrnament />,
    category: 'Acrylic'
  },
  {
    id: 'acrylic_invite',
    label: 'Acrylic Invite',
    description: 'Transparent wedding invitation card.',
    formatSpec: 'clear transparent acrylic wedding invitation card with white ink printing',
    subjectNoun: 'acrylic invitation',
    icon: <Icons.AcrylicInvite />,
    category: 'Acrylic'
  },
  {
    id: 'photo_block',
    label: 'Photo Block',
    description: 'Thick free-standing acrylic photo block.',
    formatSpec: 'thick free-standing clear acrylic photo block',
    subjectNoun: 'photo block',
    icon: <Icons.AcrylicBlockPhoto />,
    category: 'Acrylic'
  }
];