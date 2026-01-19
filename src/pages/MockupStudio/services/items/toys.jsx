import React from 'react';

import { Icons } from '../../components/MockupIcons';

export const toysItems = [
  {
    id: 'booster_pack',
    label: 'Booster Pack',
    description: 'Foil trading card booster pack.',
    formatSpec: 'shiny foil trading card booster pack with crimped edges',
    subjectNoun: 'booster pack',
    icon: <Icons.BoosterPack />,
    category: 'Toys'
  },
  {
    id: 'vinyl_figure_box',
    label: 'Figure Box',
    description: 'Square vinyl figure window box.',
    formatSpec: 'square vinyl figure box with plastic window',
    subjectNoun: 'figure box',
    icon: <Icons.FigureBox />,
    category: 'Toys'
  },
  {
    id: 'skateboard',
    label: 'Skateboard',
    description: 'Wooden skateboard deck bottom.',
    formatSpec: 'underside of a wooden skateboard deck',
    subjectNoun: 'skateboard deck',
    icon: <Icons.Skateboard />,
    category: 'Toys'
  },
  {
    id: 'teddy_bear',
    label: 'Teddy Bear',
    description: 'Classic plush teddy bear.',
    formatSpec: 'classic plush brown teddy bear wearing a t-shirt',
    subjectNoun: 'teddy bear',
    icon: <Icons.TeddyBear />,
    category: 'Toys'
  },
  {
    id: 'rubber_duck',
    label: 'Rubber Duck',
    description: 'Yellow rubber bath duck.',
    formatSpec: 'yellow rubber bath duck toy',
    subjectNoun: 'rubber duck',
    icon: <Icons.RubberDuck />,
    category: 'Toys'
  },
  {
    id: 'rpg_dice',
    label: 'RPG Dice',
    description: '20-sided polyhedral dice (D20).',
    formatSpec: '20-sided polyhedral RPG dice',
    subjectNoun: 'D20 dice',
    icon: <Icons.Dice />,
    category: 'Toys'
  },
  {
    id: 'flying_disc',
    label: 'Flying Disc',
    description: 'Plastic sport flying disc.',
    formatSpec: 'plastic flying disc frisbee',
    subjectNoun: 'flying disc',
    icon: <Icons.FlyingDisc />,
    category: 'Toys'
  },
  {
    id: 'minifigure',
    label: 'Minifigure',
    description: 'Plastic building block character.',
    formatSpec: 'plastic building block minifigure character',
    subjectNoun: 'minifigure',
    icon: <Icons.Minifigure />,
    category: 'Toys'
  },
  {
    id: 'beach_ball',
    label: 'Beach Ball',
    description: 'Inflatable beach ball.',
    formatSpec: 'inflatable plastic beach ball',
    subjectNoun: 'beach ball',
    icon: <Icons.BeachBall />,
    category: 'Toys'
  },
  {
    id: 'yoyo',
    label: 'Yo-Yo',
    description: 'Classic plastic yo-yo toy.',
    formatSpec: 'classic plastic yo-yo toy',
    subjectNoun: 'yo-yo',
    icon: <Icons.YoYo />,
    category: 'Toys'
  },
  {
    id: 'board_game',
    label: 'Board Game',
    description: 'Rectangular board game box.',
    formatSpec: 'rectangular cardboard board game box',
    subjectNoun: 'board game box',
    icon: <Icons.BoardGame />,
    category: 'Toys'
  },
  {
    id: 'playing_cards',
    label: 'Playing Cards',
    description: 'Standard playing card tuck box.',
    formatSpec: 'standard playing card tuck box',
    subjectNoun: 'card deck',
    icon: <Icons.Card />,
    category: 'Toys'
  },
  {
    id: 'action_figure_blister',
    label: 'Figure Blister',
    description: 'Action figure blister pack.',
    formatSpec: 'action figure blister pack with card backing',
    subjectNoun: 'action figure',
    icon: <Icons.BlisterPack />,
    category: 'Toys'
  },
  {
    id: 'car_blister',
    label: 'Car Blister',
    description: 'Die-cast car blister pack.',
    formatSpec: 'die-cast toy car blister pack',
    subjectNoun: 'toy car',
    icon: <Icons.BlisterPack />,
    category: 'Toys'
  },
  {
    id: 'video_game_case',
    label: 'Game Case',
    description: 'Modern blue video game case.',
    formatSpec: 'blue plastic video game case',
    subjectNoun: 'video game case',
    icon: <Icons.GameCase />,
    category: 'Toys'
  },
  {
    id: 'retro_cartridge',
    label: 'Retro Cart',
    description: 'Classic grey NES style cartridge.',
    formatSpec: 'grey retro video game cartridge',
    subjectNoun: 'game cartridge',
    icon: <Icons.GameCartridge />,
    category: 'Toys'
  },
  {
    id: 'puzzle_box',
    label: 'Puzzle Box',
    description: 'Square jigsaw puzzle box.',
    formatSpec: 'square cardboard jigsaw puzzle box',
    subjectNoun: 'puzzle box',
    icon: <Icons.PuzzleBox />,
    category: 'Toys'
  },
  {
    id: 'anime_figure',
    label: 'Scale Figure',
    description: 'PVC scale anime character figure.',
    formatSpec: 'PVC anime character scale figure',
    subjectNoun: 'anime figure',
    icon: <Icons.AnimeFigure />,
    category: 'Toys'
  },
  {
    id: 'plush',
    label: 'Chibi Plush',
    description: 'Soft stuffed chibi character plush toy.',
    formatSpec: 'soft stuffed chibi plush toy character',
    subjectNoun: 'plush toy',
    icon: <Icons.Plush />,
    category: 'Toys'
  },
  {
    id: 'capsule_toy',
    label: 'Gachapon',
    description: 'Plastic capsule toy figure.',
    formatSpec: 'gachapon capsule toy figure',
    subjectNoun: 'capsule toy',
    icon: <Icons.CapsuleToy />,
    category: 'Toys'
  },
  {
    id: 'bobblehead',
    label: 'Bobblehead',
    description: 'Custom baseball player bobblehead figure.',
    formatSpec: 'baseball player bobblehead figure',
    subjectNoun: 'bobblehead figure',
    icon: <Icons.Bobblehead />,
    category: 'Toys'
  },
  {
    id: 'game_boy_cart',
    label: 'Handheld Cart',
    description: 'Small square grey handheld game cartridge.',
    formatSpec: 'small grey square handheld game cartridge',
    subjectNoun: 'game cartridge',
    icon: <Icons.GameCartridge />,
    category: 'Toys'
  },
  {
    id: 'card_sleeve',
    label: 'Card Sleeve',
    description: 'Protective trading card sleeve.',
    formatSpec: 'single trading card in a protective sleeve',
    subjectNoun: 'card sleeve',
    icon: <Icons.CardSleeve />,
    category: 'Toys'
  },
  {
    id: 'puzzle_cube',
    label: 'Puzzle Cube',
    description: '3x3 twisty puzzle cube.',
    formatSpec: '3x3 twisty puzzle cube',
    subjectNoun: 'puzzle cube',
    icon: <Icons.PuzzleCube />,
    category: 'Toys'
  },
  {
    id: 'lunchbox',
    label: 'Retro Lunchbox',
    description: 'Metal tin lunchbox with handle.',
    formatSpec: 'retro metal tin lunchbox with handle',
    subjectNoun: 'lunchbox',
    icon: <Icons.Lunchbox />,
    category: 'Toys'
  },
  {
    id: 'dough_tub',
    label: 'Dough Tub',
    description: 'Plastic modeling dough container.',
    formatSpec: 'yellow plastic modeling dough tub container',
    subjectNoun: 'dough tub',
    icon: <Icons.DoughTub />,
    category: 'Toys'
  },
  {
    id: 'balloon',
    label: 'Balloon',
    description: 'Inflated latex party balloon.',
    formatSpec: 'inflated latex party balloon',
    subjectNoun: 'balloon',
    icon: <Icons.Balloon />,
    category: 'Toys'
  },
  {
    id: 'kite',
    label: 'Diamond Kite',
    description: 'Classic diamond-shaped kite.',
    formatSpec: 'classic diamond shaped kite flying',
    subjectNoun: 'kite',
    icon: <Icons.Kite />,
    category: 'Toys'
  },
  {
    id: 'arcade_stick',
    label: 'Arcade Stick',
    description: 'Arcade fight stick controller.',
    formatSpec: 'arcade fight stick controller',
    subjectNoun: 'arcade stick',
    icon: <Icons.ArcadeStick />,
    category: 'Toys'
  },
  {
    id: 'wooden_block',
    label: 'Toy Block',
    description: 'Wooden alphabet building block.',
    formatSpec: 'wooden alphabet building block',
    subjectNoun: 'wooden block',
    icon: <Icons.ToyBlock />,
    category: 'Toys'
  },
  {
    id: 'paddleball',
    label: 'Paddleball',
    description: 'Wooden paddle with ball on string.',
    formatSpec: 'wooden paddleball toy',
    subjectNoun: 'paddleball',
    icon: <Icons.Paddleball />,
    category: 'Toys'
  },
  {
    id: 'water_blaster',
    label: 'Water Blaster',
    description: 'Plastic water squirt gun.',
    formatSpec: 'plastic water blaster squirt gun toy',
    subjectNoun: 'water blaster',
    icon: <Icons.WaterBlaster />,
    category: 'Toys'
  },
  {
    id: 'spinning_top',
    label: 'Spinning Top',
    description: 'Classic metal spinning top.',
    formatSpec: 'classic metal spinning top toy',
    subjectNoun: 'spinning top',
    icon: <Icons.SpinningTop />,
    category: 'Toys'
  },
  {
    id: 'slime_jar',
    label: 'Slime Jar',
    description: 'Clear plastic jar of goo.',
    formatSpec: 'clear plastic jar filled with colorful slime',
    subjectNoun: 'slime jar',
    icon: <Icons.SlimeJar />,
    category: 'Toys'
  },
  {
    id: 'fidget_spinner',
    label: 'Fidget Spinner',
    description: 'Three-pronged fidget spinner.',
    formatSpec: 'tri-spinner fidget toy',
    subjectNoun: 'fidget spinner',
    icon: <Icons.FidgetSpinner />,
    category: 'Toys'
  },
  {
    id: 'doll_box',
    label: 'Doll Box',
    description: 'Tall window box for fashion doll.',
    formatSpec: 'tall retail window box packaging for fashion doll',
    subjectNoun: 'doll box',
    icon: <Icons.DollBox />,
    category: 'Toys'
  },
  {
    id: 'card_binder',
    label: 'Card Binder',
    description: 'Collector trading card album.',
    formatSpec: 'plastic trading card collector binder album',
    subjectNoun: 'card binder',
    icon: <Icons.Binder />,
    category: 'Toys'
  },
  {
    id: 'rc_controller',
    label: 'RC Controller',
    description: 'Remote control for RC car/drone.',
    formatSpec: 'radio control transmitter remote',
    subjectNoun: 'RC controller',
    icon: <Icons.RCController />,
    category: 'Toys'
  },
  {
    id: 'chess_board',
    label: 'Chess Board',
    description: 'Folding wooden chess board.',
    formatSpec: 'wooden chess board with pieces setup',
    subjectNoun: 'chess board',
    icon: <Icons.ChessBoard />,
    category: 'Toys'
  },
  {
    id: 'domino_box',
    label: 'Domino Box',
    description: 'Rectangular domino set box.',
    formatSpec: 'rectangular wooden box for domino set',
    subjectNoun: 'domino box',
    icon: <Icons.DominoBox />,
    category: 'Toys'
  },
  {
    id: 'magic_ball',
    label: 'Magic Ball',
    description: 'Fortune-telling novelty ball.',
    formatSpec: 'black plastic magic fortune telling ball',
    subjectNoun: 'magic ball',
    icon: <Icons.MagicBall />,
    category: 'Toys'
  },
  {
    id: 'dart_board',
    label: 'Dart Board',
    description: 'Bristle dartboard wall game.',
    formatSpec: 'bristle dartboard hanging on wall',
    subjectNoun: 'dart board',
    icon: <Icons.DartBoard />,
    category: 'Toys'
  }
];