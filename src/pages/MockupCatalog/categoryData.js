export const CATEGORY_MAPPING = {
    "Home & Living": {
        description: "Elevate your space with premium home decor mockups.",
        icon: "Home", // Lucide icon name
        children: ["Home", "Bedroom", "Bathroom", "Pets"]
    },
    "Food & Beverage": {
        description: "Delicious presentation for culinary creations.",
        icon: "Coffee",
        children: ["Bakery", "Kitchen", "Dining", "Candy", "Snacks", "Drinks", "Bottled", "Canned", "Freezer"]
    },
    "Apparel & Accessories": {
        description: "Fashion-forward mockups for your brand.",
        icon: "Shirt",
        children: ["Apparel", "Accessories", "Jewelry"]
    },
    "Tech & Tools": {
        description: "Modern gadgets and professional equipment.",
        icon: "Smartphone",
        children: ["Electronics", "Tools", "Vehicles", "Medical"]
    },
    "Commercial & Print": {
        description: "Professional branding and packaging solutions.",
        icon: "Printer",
        children: ["Stickers", "Packaging", "Signs", "Print"]
    },
    "Entertainment": {
        description: "Fun and engaging products for fans.",
        icon: "Gamepad2",
        children: ["Anime", "Media", "Toys", "Sports", "Acrylic"]
    }
};

// Start flat, create hierarchy
export const getParentCategory = (childCategory) => {
    for (const [parent, data] of Object.entries(CATEGORY_MAPPING)) {
        if (data.children.includes(childCategory)) {
            return parent;
        }
    }
    return "Other";
};
