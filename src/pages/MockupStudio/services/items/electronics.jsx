import React from 'react';

import { Icons } from '../../components/MockupIcons';

export const electronicsItems = [
  // --- COMPUTERS ---
  {
    id: 'gaming_pc_tower',
    label: 'Gaming PC Tower',
    description: 'High-end PC case with glass panel.',
    formatSpec: 'side view of a high-end gaming PC tower case with tempered glass side panel showing internal RGB components',
    subjectNoun: 'gaming PC',
    icon: <Icons.GamingPC />,
    category: 'Electronics'
  },
  {
    id: 'gaming_laptop_lid',
    label: 'Gaming Laptop',
    description: 'Closed high-performance laptop.',
    formatSpec: 'closed lid of a high-performance gaming laptop with glowing accents',
    subjectNoun: 'gaming laptop',
    icon: <Icons.GamingLaptop />,
    category: 'Electronics'
  },
  {
    id: 'monitor_screen',
    label: 'Gaming Monitor',
    description: 'Ultrawide gaming monitor.',
    formatSpec: 'curved ultrawide gaming monitor display',
    subjectNoun: 'gaming monitor',
    icon: <Icons.Monitor />,
    category: 'Electronics'
  },
  {
    id: 'laptop_screen',
    label: 'Laptop Screen',
    description: 'Modern aluminum laptop screen.',
    formatSpec: 'modern aluminum laptop screen displaying the design',
    subjectNoun: 'laptop',
    icon: <Icons.Laptop />,
    category: 'Electronics'
  },
  {
    id: 'tablet_screen',
    label: 'Tablet',
    description: 'Pro tablet device screen.',
    formatSpec: 'professional tablet device screen displaying the design',
    subjectNoun: 'tablet',
    icon: <Icons.Tablet />,
    category: 'Electronics'
  },
  
  // --- CONSOLES & GAMING ---
  {
    id: 'ps5_side',
    label: 'Modern Console',
    description: 'Sleek white vertical console.',
    formatSpec: 'side panel of a sleek modern white gaming console standing vertically',
    subjectNoun: 'gaming console',
    icon: <Icons.Console />,
    category: 'Electronics'
  },
  {
    id: 'xbox_series',
    label: 'Box Console',
    description: 'Monolithic black rectangular console.',
    formatSpec: 'matte black rectangular tower gaming console',
    subjectNoun: 'console',
    icon: <Icons.GamingPC />, // Similar shape
    category: 'Electronics'
  },
  {
    id: 'retro_console',
    label: 'Retro Console',
    description: 'Classic 8-bit grey console.',
    formatSpec: 'classic boxy grey 8-bit home video game console',
    subjectNoun: 'retro console',
    icon: <Icons.RetroConsole />,
    category: 'Electronics'
  },
  {
    id: 'retro_handheld',
    label: 'Retro Handheld',
    description: 'Vertical grey handheld game boy style.',
    formatSpec: 'classic vertical grey handheld gaming device',
    subjectNoun: 'retro handheld',
    icon: <Icons.RetroHandheld />,
    category: 'Electronics'
  },
  {
    id: 'clamshell_handheld',
    label: 'Clamshell Console',
    description: 'Dual screen clamshell handheld.',
    formatSpec: 'closed lid of a dual screen clamshell portable gaming console',
    subjectNoun: 'handheld console',
    icon: <Icons.ClamshellHandheld />,
    category: 'Electronics'
  },
  {
    id: 'modern_handheld',
    label: 'Modern Handheld',
    description: 'Wide pro handheld gaming PC.',
    formatSpec: 'modern wide handheld gaming PC console with thumbsticks',
    subjectNoun: 'handheld console',
    icon: <Icons.ModernHandheld />,
    category: 'Electronics'
  },
  {
    id: 'arcade_cabinet',
    label: 'Arcade Cabinet',
    description: 'Retro standing arcade machine.',
    formatSpec: 'side panel art of a retro standing arcade cabinet machine',
    subjectNoun: 'arcade cabinet',
    icon: <Icons.ArcadeCabinet />,
    category: 'Electronics'
  },
  {
    id: 'game_controller',
    label: 'Pro Controller',
    description: 'Wireless gaming controller.',
    formatSpec: 'front faceplate of a modern wireless gaming controller',
    subjectNoun: 'controller',
    icon: <Icons.Controller />,
    category: 'Electronics'
  },
  {
    id: 'fight_stick',
    label: 'Arcade Stick',
    description: 'Tournament arcade fight stick.',
    formatSpec: 'top panel of a professional arcade fighting game stick controller',
    subjectNoun: 'fight stick',
    icon: <Icons.Joystick />,
    category: 'Electronics'
  },
  {
    id: 'racing_wheel',
    label: 'Racing Wheel',
    description: 'Sim racing steering wheel.',
    formatSpec: 'center plate of a professional sim racing steering wheel',
    subjectNoun: 'racing wheel',
    icon: <Icons.RacingWheel />,
    category: 'Electronics'
  },
  {
    id: 'crt_monitor',
    label: 'CRT TV',
    description: 'Retro CRT gaming television.',
    formatSpec: 'screen of a vintage CRT gaming television set',
    subjectNoun: 'CRT TV',
    icon: <Icons.CRT />,
    category: 'Electronics'
  },

  // --- PERIPHERALS & TECH ---
  {
    id: 'gaming_chair',
    label: 'Gaming Chair',
    description: 'Racer style gaming chair.',
    formatSpec: 'backrest of a racer style gaming chair',
    subjectNoun: 'gaming chair',
    icon: <Icons.GamingChair />,
    category: 'Electronics'
  },
  {
    id: 'streaming_mic',
    label: 'Stream Mic',
    description: 'Broadcast quality desktop microphone.',
    formatSpec: 'professional broadcast desktop microphone',
    subjectNoun: 'microphone',
    icon: <Icons.Microphone />,
    category: 'Electronics'
  },
  {
    id: 'smartphone_screen',
    label: 'Smartphone',
    description: 'High-end bezel-less smartphone.',
    formatSpec: 'high-end bezel-less smartphone screen displaying the design',
    subjectNoun: 'smartphone',
    icon: <Icons.Smartphone />,
    category: 'Electronics'
  },
  {
    id: 'mechanical_keyboard',
    label: 'Mech Keyboard',
    description: 'Custom mechanical keyboard.',
    formatSpec: 'top view of a custom mechanical keyboard with RGB backlighting',
    subjectNoun: 'mechanical keyboard',
    icon: <Icons.Keyboard />,
    category: 'Electronics'
  },
  {
    id: 'gaming_mouse',
    label: 'Gaming Mouse',
    description: 'RGB gaming mouse.',
    formatSpec: 'top shell of an ergonomic RGB wireless gaming mouse',
    subjectNoun: 'gaming mouse',
    icon: <Icons.Mouse />,
    category: 'Electronics'
  },
  {
    id: 'stream_deck',
    label: 'Macro Pad',
    description: 'Customizable stream controller.',
    formatSpec: 'customizable macro keypad stream controller',
    subjectNoun: 'macro pad',
    icon: <Icons.StreamDeck />,
    category: 'Electronics'
  },
  {
    id: 'gpu_backplate',
    label: 'Graphics Card',
    description: 'High-end GPU backplate.',
    formatSpec: 'backplate of a high-end gaming graphics card',
    subjectNoun: 'graphics card',
    icon: <Icons.GPU />,
    category: 'Electronics'
  },
  {
    id: 'headphones',
    label: 'Headphones',
    description: 'Over-ear noise canceling headphones.',
    formatSpec: 'outer ear cup of modern noise-canceling headphones',
    subjectNoun: 'headphones',
    icon: <Icons.Headphones />,
    category: 'Electronics'
  },
  {
    id: 'vr_headset',
    label: 'VR Headset',
    description: 'Virtual reality headset visor.',
    formatSpec: 'front surface of a modern white VR headset visor',
    subjectNoun: 'VR headset',
    icon: <Icons.VRHeadset />,
    category: 'Electronics'
  },
  {
    id: 'drone',
    label: 'Drone',
    description: 'Camera drone top shell.',
    formatSpec: 'top body shell of a quadcopter camera drone',
    subjectNoun: 'drone',
    icon: <Icons.Drone />,
    category: 'Electronics'
  },
  {
    id: 'dslr_camera',
    label: 'Camera',
    description: 'Mirrorless camera body skin.',
    formatSpec: 'vinyl skin on a professional mirrorless camera body',
    subjectNoun: 'camera',
    icon: <Icons.Camera />,
    category: 'Electronics'
  },
  {
    id: 'smart_speaker',
    label: 'Smart Speaker',
    description: 'Fabric mesh smart speaker.',
    formatSpec: 'fabric mesh cover of a cylindrical smart home speaker',
    subjectNoun: 'smart speaker',
    icon: <Icons.SmartSpeaker />,
    category: 'Electronics'
  },
  {
    id: 'external_ssd',
    label: 'Portable SSD',
    description: 'Portable external solid state drive.',
    formatSpec: 'flat surface of a portable external SSD drive',
    subjectNoun: 'SSD drive',
    icon: <Icons.SSD />,
    category: 'Electronics'
  },
  {
    id: 'wifi_router',
    label: 'Gaming Router',
    description: 'High-performance Wi-Fi router.',
    formatSpec: 'futuristic high-performance gaming wi-fi router',
    subjectNoun: 'router',
    icon: <Icons.Router />,
    category: 'Electronics'
  }
];