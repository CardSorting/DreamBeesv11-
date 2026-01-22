import { db } from '../firebase';
import { doc, writeBatch } from 'firebase/firestore';

export const seedService = {
    seedMockupItems: async () => {
        console.log('[SeedService] Starting client-side seed...');

        // Items definition copy-pasted from server script but for client usage
        const ITEMS = [
            // Vehicles
            { category: 'Vehicles', label: 'Sports Car', iconName: 'Activity', subjectNoun: 'sleek sports car', description: 'High-end automotive shot', formatSpec: 'vehicle wrap' },
            { category: 'Vehicles', label: 'Van', iconName: 'Truck', subjectNoun: 'delivery van', description: 'Side profile of a commercial van', formatSpec: 'vehicle wrap' },

            // Electronics
            { category: 'Electronics', label: 'Phone Case', iconName: 'Smartphone', subjectNoun: 'phone case on a modern smartphone', description: 'Close up back view', formatSpec: 'phone case' },
            { category: 'Electronics', label: 'Laptop', iconName: 'Laptop', subjectNoun: 'premium laptop lid', description: 'Top down or angled view', formatSpec: 'laptop skin' },

            // Anime
            { category: 'Anime', label: 'Figure Box', iconName: 'Box', subjectNoun: 'collectible figure packaging box', description: 'Retail box display', formatSpec: 'packaging box' },
            { category: 'Anime', label: 'Poster', iconName: 'Image', subjectNoun: 'framed poster on a wall', description: 'Interior wall decor', formatSpec: 'sized poster' },

            // Home
            { category: 'Home', label: 'Cushion', iconName: 'Square', subjectNoun: 'soft throw pillow', description: 'Comfortable living room accent', formatSpec: 'square fabric' },
            { category: 'Home', label: 'Vase', iconName: 'Coffee', subjectNoun: 'ceramic vase', description: 'Modern home decor centerpiece', formatSpec: 'cylindrical ceramic' },

            // Bedroom
            { category: 'Bedroom', label: 'Pillow', iconName: 'Cloud', subjectNoun: 'fluffy bedroom sleeping pillow', description: 'Standard bed pillow', formatSpec: 'rectangular fabric' },
            { category: 'Bedroom', label: 'Bedding', iconName: 'Layers', subjectNoun: 'duvet cover set', description: 'Full bed spread view', formatSpec: 'large fabric' },

            // Bathroom
            { category: 'Bathroom', label: 'Bottle', iconName: 'Droplet', subjectNoun: 'shampoo or lotion bottle', description: 'Cosmetic packaging', formatSpec: 'plastic bottle' },
            { category: 'Bathroom', label: 'Soap', iconName: 'Square', subjectNoun: 'bar of soap', description: 'Clean minimal soap bar', formatSpec: 'soap bar' },

            // Pets
            { category: 'Pets', label: 'Dog Bowl', iconName: 'Circle', subjectNoun: 'ceramic dog bowl', description: 'Pet feeding station', formatSpec: 'ceramic bowl' },
            { category: 'Pets', label: 'Pet Bed', iconName: 'Cloud', subjectNoun: 'plush pet bed', description: 'Cozy spot for pets', formatSpec: 'fabric cushion' },

            // Tools
            { category: 'Tools', label: 'Drill', iconName: 'Tool', subjectNoun: 'power drill', description: 'Professional power tool', formatSpec: 'hard plastic tool' },
            { category: 'Tools', label: 'Hammer', iconName: 'Tool', subjectNoun: 'heavy duty hammer', description: 'Construction tool', formatSpec: 'metal and wood' },

            // Bakery
            { category: 'Bakery', label: 'Cake Box', iconName: 'Gift', subjectNoun: 'bakery cake box', description: 'Cardboard packaging for cakes', formatSpec: 'cardboard box' },
            { category: 'Bakery', label: 'Cookies', iconName: 'Circle', subjectNoun: 'freshly baked cookies', description: 'Plated or boxed cookies', formatSpec: 'food item' },

            // Kitchen
            { category: 'Kitchen', label: 'Mug', iconName: 'Coffee', subjectNoun: 'ceramic coffee mug', description: 'Classic kitchenware staple', formatSpec: 'ceramic mug' },
            { category: 'Kitchen', label: 'Knife', iconName: 'Tool', subjectNoun: 'chef knife blade', description: 'Premium cutlery', formatSpec: 'metal blade' },

            // Dining
            { category: 'Dining', label: 'Plate', iconName: 'Disc', subjectNoun: 'ceramic dining plate', description: 'Table setting view', formatSpec: 'ceramic plate' },
            { category: 'Dining', label: 'Napkin', iconName: 'Square', subjectNoun: 'folded cloth napkin', description: 'Fine dining accessory', formatSpec: 'fabric cloth' },

            // Candy
            { category: 'Candy', label: 'Lollipop', iconName: 'Smile', subjectNoun: 'swirl lollipop', description: 'Sweet treat', formatSpec: 'wrapped candy' },
            { category: 'Candy', label: 'Chocolate Bar', iconName: 'Layout', subjectNoun: 'chocolate bar wrapper', description: 'Foil wrappers and packaging', formatSpec: 'foil wrapper' },

            // Snacks
            { category: 'Snacks', label: 'Chip Bag', iconName: 'ShoppingBag', subjectNoun: 'foil potato chip bag', description: 'Crinkled snack packaging', formatSpec: 'foil bag' },
            { category: 'Snacks', label: 'Popcorn', iconName: 'Archive', subjectNoun: 'popcorn bucket', description: 'Movie theater style tub', formatSpec: 'paper bucket' },

            // Drinks
            { category: 'Drinks', label: 'Soda Cup', iconName: 'Coffee', subjectNoun: 'paper soda cup with straw', description: 'Fast food beverage', formatSpec: 'paper cup' },

            // Bottled
            { category: 'Bottled', label: 'Water Bottle', iconName: 'Droplet', subjectNoun: 'reusable water bottle', description: 'Sports hydration bottle', formatSpec: 'metal/plastic bottle' },
            { category: 'Bottled', label: 'Wine Bottle', iconName: 'Droplet', subjectNoun: 'glass wine bottle', description: 'Elegant glass packaging', formatSpec: 'glass bottle' },

            // Canned
            { category: 'Canned', label: 'Soup Can', iconName: 'Database', subjectNoun: 'metal food can', description: 'Pantry staple', formatSpec: 'metal can' },
            { category: 'Canned', label: 'Soda Can', iconName: 'Database', subjectNoun: 'aluminum soda can', description: 'Beverage packaging', formatSpec: 'aluminum can' },

            // Freezer
            { category: 'Freezer', label: 'Ice Cream Tub', iconName: 'Archive', subjectNoun: 'ice cream pint container', description: 'Frozen dessert packaging', formatSpec: 'paper tub' },

            // Stickers
            { category: 'Stickers', label: 'Round Sticker', iconName: 'Circle', subjectNoun: 'round vinyl sticker', description: 'Decal application', formatSpec: 'vinyl sticker' },
            { category: 'Stickers', label: 'Die Cut Sticker', iconName: 'Star', subjectNoun: 'die-cut vinyl sticker', description: 'Custom shape decal', formatSpec: 'vinyl sticker' },

            // Packaging
            { category: 'Packaging', label: 'Shipping Box', iconName: 'Package', subjectNoun: 'cardboard shipping box', description: 'E-commerce delivery box', formatSpec: 'cardboard box' },
            { category: 'Packaging', label: 'Mailer', iconName: 'Mail', subjectNoun: 'poly mailer bag', description: 'Shipping envelope', formatSpec: 'plastic mailer' },

            // Medical
            { category: 'Medical', label: 'Pill Bottle', iconName: 'PlusCircle', subjectNoun: 'prescription pill bottle', description: 'Pharmacy container', formatSpec: 'plastic bottle' },

            // Signs
            { category: 'Signs', label: 'Billboard', iconName: 'Layout', subjectNoun: 'outdoor billboard', description: 'Large format advertising', formatSpec: 'large format print' },
            { category: 'Signs', label: 'Poster Stand', iconName: 'Map', subjectNoun: 'standing display poster', description: 'Event signage', formatSpec: 'poster board' },

            // Print
            { category: 'Print', label: 'Business Card', iconName: 'CreditCard', subjectNoun: 'stack of business cards', description: 'Professional identity', formatSpec: 'cardstock' },
            { category: 'Print', label: 'Flyer', iconName: 'FileText', subjectNoun: 'marketing flyer', description: 'Handout or pamphlet', formatSpec: 'paper sheet' },
            { category: 'Print', label: 'Book Cover', iconName: 'Book', subjectNoun: 'hardcover book', description: 'Front cover view', formatSpec: 'book cover' },

            // Apparel
            { category: 'Apparel', label: 'T-Shirt', iconName: 'Shirt', subjectNoun: 'cotton t-shirt', description: 'Classic apparel item', formatSpec: 'fabric shirt' },
            { category: 'Apparel', label: 'Hoodie', iconName: 'User', subjectNoun: 'pullover hoodie', description: 'Warm streetwear', formatSpec: 'fabric hoodie' },
            { category: 'Apparel', label: 'Cap', iconName: 'Smile', subjectNoun: 'baseball cap', description: 'Headwear', formatSpec: 'fabric cap' },

            // Accessories
            { category: 'Accessories', label: 'Tote Bag', iconName: 'ShoppingBag', subjectNoun: 'canvas tote bag', description: 'Eco-friendly shopper', formatSpec: 'canvas fabric' },
            { category: 'Accessories', label: 'Watch', iconName: 'Watch', subjectNoun: 'wrist watch', description: 'Luxury timepiece', formatSpec: 'watch face/strap' },

            // Media
            { category: 'Media', label: 'Vinyl Record', iconName: 'Disc', subjectNoun: 'vinyl record with sleeve', description: 'Music album packaging', formatSpec: 'paper sleeve/vinyl' },

            // Toys
            { category: 'Toys', label: 'Plushie', iconName: 'Smile', subjectNoun: 'soft plush toy', description: 'Stuffed animal', formatSpec: 'plush fabric' },

            // Sports
            { category: 'Sports', label: 'Soccer Ball', iconName: 'Globe', subjectNoun: 'soccer ball', description: 'Sports equipment', formatSpec: 'leather ball' },

            // Jewelry
            { category: 'Jewelry', label: 'Ring', iconName: 'Circle', subjectNoun: 'ring box', description: 'Jewelry presentation', formatSpec: 'velvet box' },

            // Acrylic
            { category: 'Acrylic', label: 'Acrylic Stand', iconName: 'Award', subjectNoun: 'acrylic standee', description: 'Anime merch item', formatSpec: 'clear acrylic' }
        ];

        // Process in batches of 500 (though we only have ~46 items)
        const batch = writeBatch(db);

        ITEMS.forEach(item => {
            const id = `${item.category.toLowerCase()}-${item.label.toLowerCase().replace(/\s+/g, '-')}`;
            const docRef = doc(db, 'mockup_items', id);
            batch.set(docRef, { ...item, id }, { merge: true });
        });

        await batch.commit();
        console.log('[SeedService] Database populated successfully!');
        return true;
    }
};
