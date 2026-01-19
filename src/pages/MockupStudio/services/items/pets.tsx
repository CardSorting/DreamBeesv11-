import React from 'react';
import { MockupItem } from '../../types';
import { Icons } from '../../components/MockupIcons';

export const petItems: MockupItem[] = [
  {
    id: 'pet_bed',
    label: 'Pet Bed',
    description: 'Plush round dog/cat bed.',
    formatSpec: 'plush round fabric pet bed',
    subjectNoun: 'pet bed',
    icon: <Icons.PetBed />,
    category: 'Pets'
  },
  {
    id: 'pet_bowl',
    label: 'Ceramic Bowl',
    description: 'Ceramic pet food bowl.',
    formatSpec: 'heavy ceramic pet food bowl',
    subjectNoun: 'pet bowl',
    icon: <Icons.PetBowl />,
    category: 'Pets'
  },
  {
    id: 'pet_feeding_mat',
    label: 'Feeding Mat',
    description: 'Silicone or fabric bowl mat.',
    formatSpec: 'rectangular pet feeding mat under bowls',
    subjectNoun: 'feeding mat',
    icon: <Icons.FeedingMat />,
    category: 'Pets'
  },
  {
    id: 'treat_jar',
    label: 'Treat Jar',
    description: 'Ceramic treat canister with lid.',
    formatSpec: 'ceramic pet treat jar canister',
    subjectNoun: 'treat jar',
    icon: <Icons.TreatJar />,
    category: 'Pets'
  },
  {
    id: 'dog_collar',
    label: 'Dog Collar',
    description: 'Nylon dog collar with buckle.',
    formatSpec: 'nylon dog collar with plastic buckle',
    subjectNoun: 'dog collar',
    icon: <Icons.Collar />,
    category: 'Pets'
  },
  {
    id: 'dog_leash',
    label: 'Dog Leash',
    description: 'Standard nylon dog leash.',
    formatSpec: 'nylon dog leash coiled',
    subjectNoun: 'dog leash',
    icon: <Icons.Leash />,
    category: 'Pets'
  },
  {
    id: 'pet_bandana',
    label: 'Pet Bandana',
    description: 'Triangular fabric neck bandana.',
    formatSpec: 'triangular fabric pet bandana',
    subjectNoun: 'pet bandana',
    icon: <Icons.Bandana />,
    category: 'Pets'
  },
  {
    id: 'dog_hoodie',
    label: 'Dog Hoodie',
    description: 'Cotton pullover pet hoodie.',
    formatSpec: 'cotton pullover dog hoodie pet apparel',
    subjectNoun: 'dog hoodie',
    icon: <Icons.DogHoodie />,
    category: 'Pets'
  },
  {
    id: 'dog_raincoat',
    label: 'Dog Raincoat',
    description: 'Waterproof yellow rain slicker.',
    formatSpec: 'waterproof dog raincoat jacket',
    subjectNoun: 'dog raincoat',
    icon: <Icons.DogRaincoat />,
    category: 'Pets'
  },
  {
    id: 'pet_carrier',
    label: 'Pet Carrier',
    description: 'Soft-sided travel carrier bag.',
    formatSpec: 'soft-sided fabric pet travel carrier bag',
    subjectNoun: 'pet carrier',
    icon: <Icons.PetCarrier />,
    category: 'Pets'
  },
  {
    id: 'waste_bag_holder',
    label: 'Bag Holder',
    description: 'Clip-on waste bag dispenser.',
    formatSpec: 'fabric dog waste bag dispenser holder',
    subjectNoun: 'poop bag holder',
    icon: <Icons.WasteBag />,
    category: 'Pets'
  },
  {
    id: 'pet_id_tag',
    label: 'ID Tag',
    description: 'Metal bone-shaped ID tag.',
    formatSpec: 'metal bone-shaped pet ID tag',
    subjectNoun: 'pet tag',
    icon: <Icons.PetTag />,
    category: 'Pets'
  },
  {
    id: 'cat_scratcher',
    label: 'Cat Scratcher',
    description: 'Cardboard cat scratcher pad.',
    formatSpec: 'corrugated cardboard cat scratcher pad',
    subjectNoun: 'cat scratcher',
    icon: <Icons.CatScratcher />,
    category: 'Pets'
  },
  {
    id: 'cat_house',
    label: 'Cat House',
    description: 'Cardboard or fabric cat cube.',
    formatSpec: 'enclosed cat house cube',
    subjectNoun: 'cat house',
    icon: <Icons.CatHouse />,
    category: 'Pets'
  },
  {
    id: 'squeaky_toy',
    label: 'Plush Toy',
    description: 'Bone shaped plush squeaky toy.',
    formatSpec: 'plush bone-shaped dog toy',
    subjectNoun: 'dog toy',
    icon: <Icons.PetToy />,
    category: 'Pets'
  },
  {
    id: 'fish_tank',
    label: 'Fish Tank',
    description: 'Small glass desktop aquarium.',
    formatSpec: 'small glass desktop fish tank aquarium',
    subjectNoun: 'fish tank',
    icon: <Icons.FishTank />,
    category: 'Pets'
  }
];