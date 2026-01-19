
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA_mazg4YhNIJ4KYUNrMCHwF4p7PfM-Td8",
    authDomain: "dreambees-alchemist.firebaseapp.com",
    projectId: "dreambees-alchemist",
    storageBucket: "dreambees-alchemist.firebasestorage.app",
    messagingSenderId: "519217549360",
    appId: "1:519217549360:web:867310181e910b5df15df5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ITEMS = [
    // Vehicles
    { category: 'Vehicles', label: 'Sports Car', iconName: 'Activity' },
    { category: 'Vehicles', label: 'Van', iconName: 'Truck' },

    // Electronics
    { category: 'Electronics', label: 'Phone Case', iconName: 'Smartphone' },
    { category: 'Electronics', label: 'Laptop', iconName: 'Laptop' },

    // Anime
    { category: 'Anime', label: 'Figure Box', iconName: 'Box' },
    { category: 'Anime', label: 'Poster', iconName: 'Image' },

    // Home
    { category: 'Home', label: 'Cushion', iconName: 'Square' },
    { category: 'Home', label: 'Vase', iconName: 'Coffee' },

    // Bedroom
    { category: 'Bedroom', label: 'Pillow', iconName: 'Cloud' },
    { category: 'Bedroom', label: 'Bedding', iconName: 'Layers' },

    // Bathroom
    { category: 'Bathroom', label: 'Bottle', iconName: 'Droplet' },
    { category: 'Bathroom', label: 'Soap', iconName: 'Square' },

    // Pets
    { category: 'Pets', label: 'Dog Bowl', iconName: 'Circle' },
    { category: 'Pets', label: 'Pet Bed', iconName: 'Cloud' },

    // Tools
    { category: 'Tools', label: 'Drill', iconName: 'Tool' },
    { category: 'Tools', label: 'Hammer', iconName: 'Tool' },

    // Bakery
    { category: 'Bakery', label: 'Cake Box', iconName: 'Gift' },
    { category: 'Bakery', label: 'Cookies', iconName: 'Circle' },

    // Kitchen
    { category: 'Kitchen', label: 'Mug', iconName: 'Coffee' },
    { category: 'Kitchen', label: 'Knife', iconName: 'Tool' },

    // Dining
    { category: 'Dining', label: 'Plate', iconName: 'Disc' },
    { category: 'Dining', label: 'Napkin', iconName: 'Square' },

    // Candy
    { category: 'Candy', label: 'Lollipop', iconName: 'Smile' },
    { category: 'Candy', label: 'Chocolate Bar', iconName: 'Layout' },

    // Snacks
    { category: 'Snacks', label: 'Chip Bag', iconName: 'ShoppingBag' },
    { category: 'Snacks', label: 'Popcorn', iconName: 'Archive' },

    // Drinks
    { category: 'Drinks', label: 'Soda Cup', iconName: 'Coffee' },

    // Bottled
    { category: 'Bottled', label: 'Water Bottle', iconName: 'Droplet' },
    { category: 'Bottled', label: 'Wine Bottle', iconName: 'Droplet' },

    // Canned
    { category: 'Canned', label: 'Soup Can', iconName: 'Database' },
    { category: 'Canned', label: 'Soda Can', iconName: 'Database' },

    // Freezer
    { category: 'Freezer', label: 'Ice Cream Tub', iconName: 'Archive' },

    // Stickers
    { category: 'Stickers', label: 'Round Sticker', iconName: 'Circle' },
    { category: 'Stickers', label: 'Die Cut Sticker', iconName: 'Star' },

    // Packaging
    { category: 'Packaging', label: 'Shipping Box', iconName: 'Package' },
    { category: 'Packaging', label: 'Mailer', iconName: 'Mail' },

    // Medical
    { category: 'Medical', label: 'Pill Bottle', iconName: 'PlusCircle' },

    // Signs
    { category: 'Signs', label: 'Billboard', iconName: 'Layout' },
    { category: 'Signs', label: 'Poster Stand', iconName: 'Map' },

    // Print
    { category: 'Print', label: 'Business Card', iconName: 'CreditCard' },
    { category: 'Print', label: 'Flyer', iconName: 'FileText' },
    { category: 'Print', label: 'Book Cover', iconName: 'Book' },

    // Apparel
    { category: 'Apparel', label: 'T-Shirt', iconName: 'Shirt' },
    { category: 'Apparel', label: 'Hoodie', iconName: 'User' },
    { category: 'Apparel', label: 'Cap', iconName: 'Smile' },

    // Accessories
    { category: 'Accessories', label: 'Tote Bag', iconName: 'ShoppingBag' },
    { category: 'Accessories', label: 'Watch', iconName: 'Watch' },

    // Media
    { category: 'Media', label: 'Vinyl Record', iconName: 'Disc' },

    // Toys
    { category: 'Toys', label: 'Plushie', iconName: 'Smile' },

    // Sports
    { category: 'Sports', label: 'Soccer Ball', iconName: 'Globe' },

    // Jewelry
    { category: 'Jewelry', label: 'Ring', iconName: 'Circle' },

    // Acrylic
    { category: 'Acrylic', label: 'Acrylic Stand', iconName: 'Award' }
];

async function seed() {
    console.log("Starting client-side seed...");
    const batch = writeBatch(db);

    ITEMS.forEach((item, index) => {
        const id = `${item.category.toLowerCase()}-${item.label.toLowerCase().replace(/\s+/g, '-')}`;
        const ref = doc(db, "mockup_items", id);
        batch.set(ref, {
            ...item,
            id: id
        });
    });

    await batch.commit();
    console.log("Seed complete.");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seed failed", err);
    process.exit(1);
});
