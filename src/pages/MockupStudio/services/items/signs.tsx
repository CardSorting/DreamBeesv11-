import React from 'react';
import { MockupItem } from '../../types';
import { Icons } from '../../components/MockupIcons';

export const signItems: MockupItem[] = [
  {
    id: 'billboard_highway',
    label: 'Billboard',
    description: 'Large outdoor highway billboard.',
    formatSpec: 'large outdoor highway billboard advertising display against a blue sky',
    subjectNoun: 'billboard',
    icon: <Icons.Billboard />,
    category: 'Signs'
  },
  {
    id: 'billboard_vertical',
    label: 'City Billboard',
    description: 'Vertical urban digital billboard.',
    formatSpec: 'vertical digital city billboard advertisement on a building facade',
    subjectNoun: 'vertical billboard',
    icon: <Icons.Billboard />, // Reusing horizontal icon, adequate for now
    category: 'Signs'
  },
  {
    id: 'digital_kiosk',
    label: 'Digital Kiosk',
    description: 'Freestanding digital touchscreen totem.',
    formatSpec: 'vertical touchscreen digital information kiosk display in a shopping mall',
    subjectNoun: 'digital kiosk',
    icon: <Icons.DigitalKiosk />,
    category: 'Signs'
  },
  {
    id: 'bus_stop_ad',
    label: 'Bus Stop Ad',
    description: 'Glass shelter advertising poster.',
    formatSpec: 'illuminated bus stop shelter advertising poster',
    subjectNoun: 'bus stop ad',
    icon: <Icons.BusStop />,
    category: 'Signs'
  },
  {
    id: 'subway_ad',
    label: 'Subway Ad',
    description: 'Interior train car advertising card.',
    formatSpec: 'horizontal subway train interior advertising card',
    subjectNoun: 'subway ad',
    icon: <Icons.BusStop />, // Similar context
    category: 'Signs'
  },
  {
    id: 'standee_lifesize',
    label: 'Cardboard Standee',
    description: 'Life-size cardboard cutout standee.',
    formatSpec: 'life-size freestanding cardboard cutout standee',
    subjectNoun: 'cardboard standee',
    icon: <Icons.Standee />,
    category: 'Signs'
  },
  {
    id: 'mascot_costume',
    label: 'Lifesize Plush',
    description: 'Giant wearable mascot costume.',
    formatSpec: 'human-sized giant plush mascot costume character',
    subjectNoun: 'mascot costume',
    icon: <Icons.Mascot />,
    category: 'Signs'
  },
  {
    id: 'a_frame_sign',
    label: 'A-Frame Sign',
    description: 'Sidewalk sandwich board sign.',
    formatSpec: 'wooden A-frame sidewalk sandwich board sign',
    subjectNoun: 'A-frame sign',
    icon: <Icons.AFrame />,
    category: 'Signs'
  },
  {
    id: 'chalkboard_sign',
    label: 'Chalkboard Sign',
    description: 'Rustic wooden A-frame chalkboard.',
    formatSpec: 'rustic wooden A-frame chalkboard sidewalk sign with chalk art',
    subjectNoun: 'chalkboard sign',
    icon: <Icons.Chalkboard />,
    category: 'Signs'
  },
  {
    id: 'menu_board',
    label: 'Menu Board',
    description: 'Hanging cafe menu board.',
    formatSpec: 'hanging cafe menu board signage behind a counter',
    subjectNoun: 'menu board',
    icon: <Icons.MenuBoard />,
    category: 'Signs'
  },
  {
    id: 'yard_sign',
    label: 'Yard Sign',
    description: 'Corrugated plastic lawn sign.',
    formatSpec: 'corrugated plastic lawn sign on wire stakes in grass',
    subjectNoun: 'yard sign',
    icon: <Icons.YardSign />,
    category: 'Signs'
  },
  {
    id: 'real_estate_sign',
    label: 'Real Estate Post',
    description: 'Hanging post real estate sign.',
    formatSpec: 'colonial style white wooden real estate sign post with hanging board',
    subjectNoun: 'real estate sign',
    icon: <Icons.RealEstatePost />,
    category: 'Signs'
  },
  {
    id: 'storefront_blade',
    label: 'Blade Sign',
    description: 'Round hanging shop sign.',
    formatSpec: 'round metal blade sign hanging from a brick storefront wall',
    subjectNoun: 'shop sign',
    icon: <Icons.BladeSign />,
    category: 'Signs'
  },
  {
    id: 'window_decal',
    label: 'Window Decal',
    description: 'Vinyl shop window graphic.',
    formatSpec: 'vinyl window decal graphic on a glass storefront',
    subjectNoun: 'window decal',
    icon: <Icons.WindowDecal />,
    category: 'Signs'
  },
  {
    id: 'neon_sign',
    label: 'Neon Sign',
    description: 'Glowing wall-mounted neon light.',
    formatSpec: 'glowing electric neon sign mounted on a brick wall',
    subjectNoun: 'neon sign',
    icon: <Icons.NeonSign />,
    category: 'Signs'
  },
  {
    id: 'lightbox_poster',
    label: 'Lightbox',
    description: 'Illuminated movie poster box.',
    formatSpec: 'illuminated movie poster lightbox frame on a wall',
    subjectNoun: 'lightbox poster',
    icon: <Icons.Lightbox />,
    category: 'Signs'
  },
  {
    id: 'marquee_sign',
    label: 'Marquee',
    description: 'Vintage cinema marquee sign.',
    formatSpec: 'vintage cinema marquee sign with glowing bulb letters',
    subjectNoun: 'marquee sign',
    icon: <Icons.Marquee />,
    category: 'Signs'
  },
  {
    id: 'rollup_banner',
    label: 'Roll-up Banner',
    description: 'Retractable standing event banner.',
    formatSpec: 'vertical retractable roll-up event banner stand',
    subjectNoun: 'roll-up banner',
    icon: <Icons.RollUpBanner />,
    category: 'Signs'
  },
  {
    id: 'feather_flag',
    label: 'Feather Flag',
    description: 'Teardrop marketing banner.',
    formatSpec: 'teardrop marketing feather flag banner on a pole',
    subjectNoun: 'feather flag',
    icon: <Icons.FeatherFlag />,
    category: 'Signs'
  },
  {
    id: 'fence_banner',
    label: 'Fence Banner',
    description: 'Construction mesh fence banner.',
    formatSpec: 'printed mesh banner attached to a temporary construction chain-link fence',
    subjectNoun: 'fence banner',
    icon: <Icons.FenceBanner />,
    category: 'Signs'
  },
  {
    id: 'trade_show_backdrop',
    label: 'Event Backdrop',
    description: 'Large curved trade show display.',
    formatSpec: 'large curved trade show display backdrop wall',
    subjectNoun: 'backdrop',
    icon: <Icons.Backdrop />,
    category: 'Signs'
  },
  {
    id: 'podium_counter',
    label: 'Event Podium',
    description: 'Branded trade show counter.',
    formatSpec: 'branded trade show podium counter',
    subjectNoun: 'podium counter',
    icon: <Icons.Podium />,
    category: 'Signs'
  },
  {
    id: 'event_tent',
    label: 'Event Tent',
    description: 'Branded pop-up canopy tent.',
    formatSpec: 'branded outdoor pop-up canopy event tent',
    subjectNoun: 'canopy tent',
    icon: <Icons.Tent />,
    category: 'Signs'
  },
  {
    id: 'table_cover',
    label: 'Table Cover',
    description: 'Draped event table cloth.',
    formatSpec: 'branded trade show table cloth throw draped over a table',
    subjectNoun: 'table cloth',
    icon: <Icons.TableCover />,
    category: 'Signs'
  },
  {
    id: 'table_stand',
    label: 'Tabletop Sign',
    description: 'Acrylic tabletop display stand.',
    formatSpec: 'acrylic tabletop display stand holder on a restaurant table',
    subjectNoun: 'tabletop sign',
    icon: <Icons.TableStand />,
    category: 'Signs'
  },
  {
    id: 'office_door_sign',
    label: 'Door Plate',
    description: 'Office door nameplate.',
    formatSpec: 'metal office door nameplate sign',
    subjectNoun: 'door nameplate',
    icon: <Icons.DoorPlate />,
    category: 'Signs'
  },
  {
    id: 'wayfinding_sign',
    label: 'Wayfinding',
    description: 'Directional signage post.',
    formatSpec: 'directional wayfinding signage post with arrows',
    subjectNoun: 'wayfinding sign',
    icon: <Icons.Wayfinding />,
    category: 'Signs'
  },
  {
    id: 'floor_decal',
    label: 'Floor Decal',
    description: 'Adhesive vinyl floor graphic.',
    formatSpec: 'vinyl floor decal sticker on polished concrete',
    subjectNoun: 'floor decal',
    icon: <Icons.FloorDecal />,
    category: 'Signs'
  },
  {
    id: 'shelf_wobbler',
    label: 'Shelf Wobbler',
    description: 'Retail shelf edge tag.',
    formatSpec: 'retail shelf talker wobbler sign attached to a grocery store shelf edge',
    subjectNoun: 'shelf wobbler',
    icon: <Icons.ShelfWobbler />,
    category: 'Signs'
  },
  {
    id: 'car_magnet',
    label: 'Car Magnet',
    description: 'Magnetic vehicle door sign.',
    formatSpec: 'magnetic advertising sign attached to the side door of a white van',
    subjectNoun: 'car magnet',
    icon: <Icons.CarMagnet />,
    category: 'Signs'
  },
  {
    id: 'monument_sign',
    label: 'Monument Sign',
    description: 'Ground-level stone entrance sign.',
    formatSpec: 'stone and stucco monument entrance sign on a manicured lawn',
    subjectNoun: 'monument sign',
    icon: <Icons.MonumentSign />,
    category: 'Signs'
  },
  {
    id: 'street_pole_banner',
    label: 'Street Banner',
    description: 'Vertical vinyl lamp post banner.',
    formatSpec: 'vertical vinyl banner hanging from a street lamp post',
    subjectNoun: 'street banner',
    icon: <Icons.Flag />, // Reusing flag icon
    category: 'Signs'
  }
];