import React from 'react';
import { MockupItem } from '../../types';
import { Icons } from '../../components/MockupIcons';

export const vehicleItems: MockupItem[] = [
  {
    id: 'sedan_wrap',
    label: 'Sedan Wrap',
    description: 'Modern 4-door sedan car wrap.',
    formatSpec: 'full vinyl vehicle wrap on a modern 4-door white sedan',
    subjectNoun: 'sedan car',
    icon: <Icons.Sedan />,
    category: 'Vehicles'
  },
  {
    id: 'delivery_van',
    label: 'Delivery Van',
    description: 'Commercial cargo delivery van.',
    formatSpec: 'white commercial cargo delivery van with side branding panel',
    subjectNoun: 'delivery van',
    icon: <Icons.Van />,
    category: 'Vehicles'
  },
  {
    id: 'box_truck',
    label: 'Box Truck',
    description: 'Large commercial moving truck.',
    formatSpec: 'side view of a large white commercial box truck',
    subjectNoun: 'box truck',
    icon: <Icons.BoxTruck />,
    category: 'Vehicles'
  },
  {
    id: 'pickup_truck',
    label: 'Pickup Truck',
    description: 'Heavy duty pickup truck.',
    formatSpec: 'heavy duty crew cab pickup truck',
    subjectNoun: 'pickup truck',
    icon: <Icons.Pickup />,
    category: 'Vehicles'
  },
  {
    id: 'semi_truck',
    label: 'Semi Truck',
    description: 'Large 18-wheeler semi trailer truck.',
    formatSpec: 'side view of a massive white 18-wheeler semi truck with trailer',
    subjectNoun: 'semi truck',
    icon: <Icons.SemiTruck />,
    category: 'Vehicles'
  },
  {
    id: 'tanker_truck',
    label: 'Tanker Truck',
    description: 'Liquid transport tanker truck.',
    formatSpec: 'chrome liquid transport tanker truck trailer',
    subjectNoun: 'tanker truck',
    icon: <Icons.Tanker />,
    category: 'Vehicles'
  },
  {
    id: 'dump_truck',
    label: 'Dump Truck',
    description: 'Construction dump truck.',
    formatSpec: 'yellow heavy construction dump truck',
    subjectNoun: 'dump truck',
    icon: <Icons.DumpTruck />,
    category: 'Vehicles'
  },
  {
    id: 'city_bus',
    label: 'City Bus',
    description: 'City transit bus advertisement.',
    formatSpec: 'side advertisement panel on a city transit bus',
    subjectNoun: 'city bus',
    icon: <Icons.Bus />,
    category: 'Vehicles'
  },
  {
    id: 'school_bus',
    label: 'School Bus',
    description: 'Classic yellow school bus.',
    formatSpec: 'classic yellow school bus side view',
    subjectNoun: 'school bus',
    icon: <Icons.SchoolBus />,
    category: 'Vehicles'
  },
  {
    id: 'ambulance',
    label: 'Ambulance',
    description: 'Emergency ambulance vehicle.',
    formatSpec: 'modern white emergency ambulance van',
    subjectNoun: 'ambulance',
    icon: <Icons.Ambulance />,
    category: 'Vehicles'
  },
  {
    id: 'police_car',
    label: 'Police Car',
    description: 'Police interceptor vehicle.',
    formatSpec: 'black and white police interceptor car with light bar',
    subjectNoun: 'police car',
    icon: <Icons.PoliceCar />,
    category: 'Vehicles'
  },
  {
    id: 'fire_truck',
    label: 'Fire Truck',
    description: 'Red fire engine truck.',
    formatSpec: 'large red fire engine truck',
    subjectNoun: 'fire truck',
    icon: <Icons.FireTruck />,
    category: 'Vehicles'
  },
  {
    id: 'sports_car',
    label: 'Sports Car',
    description: 'Luxury high-performance sports car.',
    formatSpec: 'sleek luxury high-performance sports car',
    subjectNoun: 'sports car',
    icon: <Icons.SportsCar />,
    category: 'Vehicles'
  },
  {
    id: 'food_truck',
    label: 'Food Truck',
    description: 'Street food truck service window.',
    formatSpec: 'street food truck service window side',
    subjectNoun: 'food truck',
    icon: <Icons.FoodTruck />,
    category: 'Vehicles'
  },
  {
    id: 'motorcycle',
    label: 'Motorcycle',
    description: 'Sport bike motorcycle.',
    formatSpec: 'sport bike motorcycle fairing',
    subjectNoun: 'motorcycle',
    icon: <Icons.Motorcycle />,
    category: 'Vehicles'
  },
  {
    id: 'bicycle',
    label: 'Bicycle',
    description: 'Urban city bicycle frame.',
    formatSpec: 'urban city bicycle frame',
    subjectNoun: 'bicycle',
    icon: <Icons.Bicycle />,
    category: 'Vehicles'
  },
  {
    id: 'scooter',
    label: 'E-Scooter',
    description: 'Electric city scooter.',
    formatSpec: 'modern electric city scooter standing on pavement',
    subjectNoun: 'electric scooter',
    icon: <Icons.Scooter />,
    category: 'Vehicles'
  },
  {
    id: 'atv',
    label: 'ATV',
    description: 'All-terrain quad bike.',
    formatSpec: 'off-road 4-wheeler ATV quad bike',
    subjectNoun: 'ATV',
    icon: <Icons.ATV />,
    category: 'Vehicles'
  },
  {
    id: 'snowmobile',
    label: 'Snowmobile',
    description: 'Winter snowmobile sled.',
    formatSpec: 'winter sport snowmobile on snow',
    subjectNoun: 'snowmobile',
    icon: <Icons.Snowmobile />,
    category: 'Vehicles'
  },
  {
    id: 'rv_camper',
    label: 'RV Camper',
    description: 'Recreational vehicle motorhome.',
    formatSpec: 'modern white RV camper motorhome',
    subjectNoun: 'RV camper',
    icon: <Icons.RV />,
    category: 'Vehicles'
  },
  {
    id: 'subway_car',
    label: 'Subway Car',
    description: 'Metro train car exterior.',
    formatSpec: 'exterior side of a modern silver subway train car',
    subjectNoun: 'subway car',
    icon: <Icons.Subway />,
    category: 'Vehicles'
  },
  {
    id: 'train_locomotive',
    label: 'Train Engine',
    description: 'Diesel locomotive train engine.',
    formatSpec: 'powerful diesel locomotive train engine',
    subjectNoun: 'train engine',
    icon: <Icons.Train />,
    category: 'Vehicles'
  },
  {
    id: 'trailer',
    label: 'Cargo Trailer',
    description: 'Enclosed cargo trailer.',
    formatSpec: 'enclosed white cargo trailer',
    subjectNoun: 'trailer',
    icon: <Icons.Trailer />,
    category: 'Vehicles'
  },
  {
    id: 'private_jet',
    label: 'Private Jet',
    description: 'Business jet fuselage.',
    formatSpec: 'white private business jet fuselage',
    subjectNoun: 'private jet',
    icon: <Icons.Plane />,
    category: 'Vehicles'
  },
  {
    id: 'helicopter',
    label: 'Helicopter',
    description: 'Private civilian helicopter.',
    formatSpec: 'sleek modern private helicopter',
    subjectNoun: 'helicopter',
    icon: <Icons.Helicopter />,
    category: 'Vehicles'
  },
  {
    id: 'hot_air_balloon',
    label: 'Hot Air Balloon',
    description: 'Large hot air balloon envelope.',
    formatSpec: 'colorful giant hot air balloon in the sky',
    subjectNoun: 'hot air balloon',
    icon: <Icons.HotAirBalloon />,
    category: 'Vehicles'
  },
  {
    id: 'blimp',
    label: 'Blimp',
    description: 'Aerial advertising blimp.',
    formatSpec: 'large aerial advertising blimp airship',
    subjectNoun: 'blimp',
    icon: <Icons.Blimp />,
    category: 'Vehicles'
  },
  {
    id: 'boat_hull',
    label: 'Speed Boat',
    description: 'Motorboat hull branding.',
    formatSpec: 'side hull of a modern recreational motorboat',
    subjectNoun: 'speed boat',
    icon: <Icons.Boat />,
    category: 'Vehicles'
  },
  {
    id: 'yacht',
    label: 'Luxury Yacht',
    description: 'Large luxury yacht profile.',
    formatSpec: 'side profile of a large white luxury yacht on water',
    subjectNoun: 'yacht',
    icon: <Icons.Yacht />,
    category: 'Vehicles'
  },
  {
    id: 'jet_ski',
    label: 'Jet Ski',
    description: 'Personal watercraft.',
    formatSpec: 'personal watercraft jet ski on water',
    subjectNoun: 'jet ski',
    icon: <Icons.JetSki />,
    category: 'Vehicles'
  },
  {
    id: 'golf_cart',
    label: 'Golf Cart',
    description: 'Standard golf cart.',
    formatSpec: 'white standard golf cart',
    subjectNoun: 'golf cart',
    icon: <Icons.GolfCart />,
    category: 'Vehicles'
  },
  {
    id: 'race_car',
    label: 'Race Car',
    description: 'Formula style race car.',
    formatSpec: 'formula 1 style single seater race car',
    subjectNoun: 'race car',
    icon: <Icons.RaceCar />,
    category: 'Vehicles'
  },
  {
    id: 'taxi',
    label: 'Taxi Cab',
    description: 'Yellow city taxi cab.',
    formatSpec: 'classic yellow city taxi cab',
    subjectNoun: 'taxi',
    icon: <Icons.Taxi />,
    category: 'Vehicles'
  },
  {
    id: 'tuk_tuk',
    label: 'Tuk Tuk',
    description: 'Auto rickshaw taxi.',
    formatSpec: 'auto rickshaw tuk tuk vehicle',
    subjectNoun: 'tuk tuk',
    icon: <Icons.TukTuk />,
    category: 'Vehicles'
  },
  {
    id: 'tractor',
    label: 'Tractor',
    description: 'Farm agricultural tractor.',
    formatSpec: 'modern green agricultural farm tractor',
    subjectNoun: 'tractor',
    icon: <Icons.Tractor />,
    category: 'Vehicles'
  },
  {
    id: 'forklift',
    label: 'Forklift',
    description: 'Warehouse forklift truck.',
    formatSpec: 'industrial warehouse forklift truck',
    subjectNoun: 'forklift',
    icon: <Icons.Forklift />,
    category: 'Vehicles'
  }
];