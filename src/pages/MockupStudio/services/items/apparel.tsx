import React from 'react';
import { MockupItem } from '../../types';
import { Icons } from '../../components/MockupIcons';

export const apparelItems: MockupItem[] = [
  {
    id: 'tshirt_screenprint',
    label: 'Standard T-Shirt',
    description: 'Classic heavyweight cotton crew neck t-shirt.',
    formatSpec: 'heavyweight cotton crew neck t-shirt featuring the design as a high-quality screen print ink application',
    subjectNoun: 't-shirt',
    icon: <Icons.SimpleShirt />,
    category: 'Apparel'
  },
  {
    id: 'tshirt_vintage',
    label: 'Vintage Tee',
    description: 'Washed oversized tee with cracked print.',
    formatSpec: 'washed black oversized vintage t-shirt featuring the design as a distressed, cracked plastisol screen print',
    subjectNoun: 'vintage t-shirt',
    icon: <Icons.VintageTee />,
    category: 'Apparel'
  },
  {
    id: 'tshirt_acid_wash',
    label: 'Acid Wash Tee',
    description: 'Textured acid wash/mineral wash tee.',
    formatSpec: 'dark grey mineral acid wash t-shirt featuring the design as a soft water-based ink print',
    subjectNoun: 'acid wash t-shirt',
    icon: <Icons.VintageTee />, // Reusing vintage for now, effectively similar vibe
    category: 'Apparel'
  },
  {
    id: 'tshirt_tiedye',
    label: 'Tie-Dye Tee',
    description: 'Spiral tie-dye cotton t-shirt.',
    formatSpec: 'spiral tie-dye pattern cotton t-shirt featuring the design printed in black ink',
    subjectNoun: 'tie-dye t-shirt',
    icon: <Icons.TieDyeShirt />,
    category: 'Apparel'
  },
  {
    id: 'tshirt_longsleeve',
    label: 'Long Sleeve',
    description: 'Standard cotton long sleeve tee.',
    formatSpec: 'standard cotton long sleeve t-shirt featuring the design printed on the chest',
    subjectNoun: 'long sleeve shirt',
    icon: <Icons.LongSleeve />,
    category: 'Apparel'
  },
  {
    id: 'crop_top',
    label: 'Crop Top',
    description: 'Fitted cotton crop top.',
    formatSpec: 'fitted cotton crop top featuring the design printed on the front',
    subjectNoun: 'crop top',
    icon: <Icons.CropTop />,
    category: 'Apparel'
  },
  {
    id: 'polo_shirt',
    label: 'Polo Shirt',
    description: 'Classic pique cotton polo shirt.',
    formatSpec: 'pique cotton polo shirt featuring the design as a small embroidered chest logo',
    subjectNoun: 'polo shirt',
    icon: <Icons.Polo />,
    category: 'Apparel'
  },
  {
    id: 'sweatshirt',
    label: 'Sweatshirt',
    description: 'Heavyweight cotton crewneck sweatshirt.',
    formatSpec: 'heavyweight cotton crewneck sweatshirt featuring the design as a direct-to-garment (DTG) print',
    subjectNoun: 'sweatshirt',
    icon: <Icons.Sweatshirt />,
    category: 'Apparel'
  },
  {
    id: 'hoodie_puff',
    label: 'Puff Print Hoodie',
    description: 'Fleece hoodie with 3D puff print.',
    formatSpec: 'fleece pullover hoodie featuring the design as a raised 3D puff screen print',
    subjectNoun: 'puff print hoodie',
    icon: <Icons.Hoodie />,
    category: 'Apparel'
  },
  {
    id: 'hoodie_zip',
    label: 'Zip-Up Hoodie',
    description: 'Cotton fleece zip-up hoodie.',
    formatSpec: 'cotton fleece zip-up hoodie featuring the design printed on the left chest and back',
    subjectNoun: 'zip-up hoodie',
    icon: <Icons.ZipHoodie />,
    category: 'Apparel'
  },
  {
    id: 'varsity_jacket',
    label: 'Varsity Jacket',
    description: 'Wool letterman jacket with chenille patches.',
    formatSpec: 'classic wool varsity jacket featuring the design as a textured chenille patch',
    subjectNoun: 'varsity jacket',
    icon: <Icons.VarsityJacket />,
    category: 'Apparel'
  },
  {
    id: 'jacket_denim',
    label: 'Denim Jacket',
    description: 'Classic blue denim trucker jacket.',
    formatSpec: 'classic blue denim trucker jacket featuring the design painted on the back panel',
    subjectNoun: 'denim jacket',
    icon: <Icons.DenimJacket />,
    category: 'Apparel'
  },
  {
    id: 'jacket_puffer',
    label: 'Puffer Jacket',
    description: 'Quilted nylon puffer jacket.',
    formatSpec: 'shiny quilted nylon puffer jacket featuring the design printed on the chest',
    subjectNoun: 'puffer jacket',
    icon: <Icons.PufferJacket />,
    category: 'Apparel'
  },
  {
    id: 'baby_jumper',
    label: 'Baby Jumper',
    description: 'Soft cotton baby one-piece bodysuit.',
    formatSpec: 'white cotton baby one-piece bodysuit with water-based eco-friendly ink print',
    subjectNoun: 'baby bodysuit',
    icon: <Icons.BabyOnePiece />,
    category: 'Apparel'
  },
  {
    id: 'sweatpants',
    label: 'Sweatpants',
    description: 'Cotton fleece jogger sweatpants.',
    formatSpec: 'cotton fleece jogger sweatpants featuring the design running vertically down the leg',
    subjectNoun: 'sweatpants',
    icon: <Icons.Pants />,
    category: 'Apparel'
  },
  {
    id: 'leggings',
    label: 'Leggings',
    description: 'All-over print spandex leggings.',
    formatSpec: 'athletic spandex leggings featuring the design as an all-over sublimation print pattern',
    subjectNoun: 'leggings',
    icon: <Icons.Leggings />,
    category: 'Apparel'
  },
  {
    id: 'socks_knit',
    label: 'Knit Socks',
    description: 'Jacquard knit crew socks.',
    formatSpec: 'jacquard knit crew socks where the design is knitted directly into the fabric pattern',
    subjectNoun: 'knit socks',
    icon: <Icons.Socks />,
    category: 'Apparel'
  },
  {
    id: 'apron',
    label: 'Canvas Apron',
    description: 'Heavy cotton canvas kitchen apron.',
    formatSpec: 'heavy cotton canvas kitchen apron featuring the design as a screen print',
    subjectNoun: 'apron',
    icon: <Icons.Apron />,
    category: 'Apparel'
  },
  {
    id: 'beanie_embroidered',
    label: 'Beanie',
    description: 'Knit cuff beanie cap with embroidery.',
    formatSpec: 'knit cuff beanie cap featuring the design as high-quality 3D raised embroidery',
    subjectNoun: 'beanie cap',
    icon: <Icons.Beanie />,
    category: 'Apparel'
  },
  {
    id: 'beanie_leather_patch',
    label: 'Patch Beanie',
    description: 'Beanie with leather patch.',
    formatSpec: 'knit beanie featuring the design laser etched onto a brown leather patch',
    subjectNoun: 'leather patch beanie',
    icon: <Icons.Beanie />,
    category: 'Apparel'
  },
  {
    id: 'baseball_cap',
    label: 'Dad Hat',
    description: 'Cotton twill baseball cap.',
    formatSpec: 'washed cotton twill "dad hat" baseball cap featuring the design as direct embroidery',
    subjectNoun: 'baseball cap',
    icon: <Icons.Cap />,
    category: 'Apparel'
  },
  {
    id: 'trucker_hat',
    label: 'Trucker Hat',
    description: 'Foam front mesh back trucker hat.',
    formatSpec: 'foam front mesh back trucker hat featuring the design screen printed on the foam panel',
    subjectNoun: 'trucker hat',
    icon: <Icons.TruckerHat />,
    category: 'Apparel'
  },
  {
    id: 'bucket_hat',
    label: 'Bucket Hat',
    description: 'Cotton twill bucket hat.',
    formatSpec: 'cotton twill bucket hat featuring the design embroidered on the front',
    subjectNoun: 'bucket hat',
    icon: <Icons.BucketHat />,
    category: 'Apparel'
  },
  {
    id: 'sports_headband',
    label: 'Headband',
    description: 'Athletic sports headband.',
    formatSpec: 'elastic athletic sports headband featuring the design as a woven label',
    subjectNoun: 'sports headband',
    icon: <Icons.Headband />,
    category: 'Apparel'
  },
  {
    id: 'soccer_jersey',
    label: 'Soccer Jersey',
    description: 'Sublimated poly sports jersey.',
    formatSpec: 'polyester sports jersey featuring the design as an all-over dye sublimation print',
    subjectNoun: 'soccer jersey',
    icon: <Icons.SportsJersey />,
    category: 'Apparel'
  }
];