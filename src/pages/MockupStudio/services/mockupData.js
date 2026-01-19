import { printItems } from './items/print';
import { apparelItems } from './items/apparel';
import { accessoriesItems } from './items/accessories';
import { homeItems } from './items/home';
import { packagingItems } from './items/packaging';
import { corporateItems } from './items/corporate';
import { mediaItems } from './items/media';
import { toysItems } from './items/toys';
import { sportsItems } from './items/sports';
import { jewelryItems } from './items/jewelry';
import { acrylicItems } from './items/acrylic';
import { foodItems } from './items/food';
import { medicalItems } from './items/medical';
import { signItems } from './items/signs';
import { stickerItems } from './items/stickers';
import { vehicleItems } from './items/vehicles';
import { electronicsItems } from './items/electronics';
import { animeItems } from './items/anime';
import { bathroomItems } from './items/bathroom';
import { bedroomItems } from './items/bedroom';
import { petItems } from './items/pets';
import { toolItems } from './items/tools';

export const MOCKUP_ITEMS = [
    ...packagingItems,
    ...printItems,
    ...apparelItems,
    ...accessoriesItems,
    ...corporateItems,
    ...homeItems,
    ...bathroomItems,
    ...bedroomItems,
    ...petItems,
    ...toolItems,
    ...mediaItems,
    ...toysItems,
    ...sportsItems,
    ...jewelryItems,
    ...acrylicItems,
    ...foodItems,
    ...medicalItems,
    ...signItems,
    ...stickerItems,
    ...vehicleItems,
    ...electronicsItems,
    ...animeItems
];
