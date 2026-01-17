import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Upload, X, RotateCcw, Sparkles, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../utils';
import './DressUp.css';

const MAIN_CATEGORIES = {
    'Costumes 🦸': [], // Triggers drill-down
    'Roles 🕵️': ['Doctor 🩺', 'Firefighter 🚒', 'Chef 🍳', 'Artist 🎨', 'Rock Star 🎸', 'Detective 🔍'],
    'Fashion 👗': [], // Triggers drill-down
    'Accessories 🕶️': [], // Triggers drill-down
    'Hair Color 💇‍♀️': ['Pink Hair 🩷', 'Blue Hair 💙', 'Rainbow Hair 🌈', 'Green Hair 💚', 'Golden Blonde 💛', 'Red Hair ❤️', 'Purple Hair 💜'],
    'Makeup 💄': ['Clown Face 🤡', 'Face Paint 🎨', 'Glitter ✨', 'Cat Whiskers 🐱', 'Superhero Mask 🎭', 'Butterfly Face Paint 🦋'],
    'Vibes ✨': ['Rainbow Power 🌈', 'Underwater 🐠', 'Outer Space 🌌', 'Candy Land 🍭', 'Spooky House 👻', 'Sunshine Day ☀️', 'Winter Wonderland ❄️'],
    'Backgrounds 🏰': ['Treehouse 🌳', 'Toy Store 🧸', 'Magic Castle 🏰', 'Playground 🛝', 'Moon Surface 🌕']
};

const FASHION_COLLECTION = {
    'Tops 👚': ['Cool Hoodie 🧥', 'Graphic T-Shirt 👕', 'Blouse 👚', 'Cozy Sweater 🧶', 'Tank Top 🎽', 'Flannel Shirt 🟥'],
    'Bottoms 👖': ['Denim Jeans 👖', 'Sparkly Skirt 👗', 'Cargo Shorts 🩳', 'Leggings 🏃‍♀️', 'Pajama Pants 🛌'],
    'Dresses 👗': ['Summer Sundress ☀️', 'Fancy Ball Gown 💃', 'Party Dress 🎉', 'Flower Girl Dress 🌸'],
    'Outerwear 🧥': ['Winter Puffer Coat ❄️', 'Denim Jacket 🧥', 'Yellow Raincoat 🌧️', 'School Blazer 🏫'],
    'Footwear 👟': ['Cool Sneakers 👟', 'Cowboy Boots 🤠', 'Summer Sandals ☀️', 'Ballet Flats 🩰', 'Rain Boots ☔'],
    'Sleep & Swim 🌙': ['Comfy Pajamas 🛌', 'Onesie 🦄', 'Swimsuit 🩱', 'Rash Guard 🏄‍♂️', 'Bathrobe 🧖'],
    'Sports Gear ⚽': ['Soccer Jersey ⚽', 'Tennis Outfit 🎾', 'Karate Gi 🥋', 'Baseball Uniform ⚾', 'Basketball Jersey 🏀', 'Gymnast Leotard 🤸‍♀️'],
    'Party Wear 🎉': ['Tuxedo 🤵', 'Sparkly Vest ✨', 'Sequin Dress 👗', 'Bowtie Suit 🎀', 'Fancy Blazer 🧥', 'Gala Gown 💃']
};

const ACCESSORIES_COLLECTION = {
    'Headwear 🎩': ['Baseball Cap 🧢', 'Beanie 🧶', 'Cowboy Hat 🤠', 'Crown 👑', 'Flower Crown 🌸', 'Space Helmet 👨‍🚀', 'Viking Helmet 🛡️', 'Chef Hat 🍳', 'Party Hat 🥳', 'Cat Ears 🐱', 'Beret 🎨', 'Sombrero 🇲🇽'],
    'Eyewear 🕶️': ['Cool Sunglasses 🕶️', 'Heart Glasses 🩷', 'Harry Potter Glasses 👓', 'Star Glasses ⭐', 'Aviators 🕶️', '3D Glasses 🎬', 'Ski Goggles 🏂', 'Monocle 🧐', 'VR Headset 🥽', 'Masquerade Mask 🎭'],
    'Jewelry 💎': ['Pearl Necklace 📿', 'Gold Chain 🥇', 'Diamond Earrings 💎', 'Friendship Bracelet 🧶', 'Magic Ring 💍', 'Locket 💖', 'Shell Necklace 🐚', 'Sparkly Brooch ✨', 'Choker 🎀', 'Wristwatch ⌚'],
    'Props 🎈': ['Magic Wand 🪄', 'Balloon 🎈', 'Teddy Bear 🧸', 'Guitar 🎸', 'Soccer Ball ⚽', 'Microphone 🎤', 'Flower Bouquet 💐', 'Umbrella ☂️', 'Ice Cream 🍦', 'Skateboard 🛹', 'Book 📖', 'Lantern 🏮'],
    'Bags & Packs 🎒': ['Backpack 🎒', 'Tote Bag 🛍️', 'Fanny Pack 👝', 'Purse 👜', 'Messenger Bag 💼', 'Picnic Basket 🧺'],
    'Capes & Wings 🦋': ['Superhero Cape 🦸', 'Fairy Wings 🧚‍♀️', 'Butterfly Wings 🦋', 'Vampire Cape 🧛', 'Angel Wings 👼', 'Dragon Wings 🐉'],
    'Scarves & Gloves 🧣': ['Wool Scarf 🧣', 'Mittens 🧤', 'Magic Gloves ✨', 'Silk Scarf 🧣', 'Boxing Gloves 🥊', 'Winter Gloves ❄️']
};

const COSTUMES_COLLECTION = {
    'Fantasy 🧚‍♀️': ['Fairy Princess 🧚‍♀️', 'Pirate Captain 🏴‍☠️', 'Magician 🎩', 'Mermaid 🧜‍♀️', 'Knight 🛡️', 'Elf 🧝', 'Wizard 🧙‍♂️', 'Dragon 🐉', 'Unicorn 🦄', 'King 👑', 'Queen 👸', 'Gnome 🍄'],
    'Heroes 🚀': ['Super Hero ⚡', 'Space Explorer 🚀', 'Robot 🤖', 'Alien 👽', 'Cyborg 🦾', 'Astronaut 👩‍🚀', 'Villain 🦹', 'Power Ranger 🛡️', 'Mech Suit 🦾', 'Time Traveler ⏳'],
    'Animals 🦁': ['Dinosaur Suit 🦖', 'Lion 🦁', 'Bear 🐻', 'Bunny 🐰', 'Shark 🦈', 'Tiger 🐯', 'Panda 🐼', 'Penguin 🐧', 'Bumblebee 🐝', 'Ladybug 🐞', 'Monkey 🐒', 'Chicken 🐔'],
    'Spooky 👻': ['Vampire 🧛', 'Ghost 👻', 'Mummy 🤕', 'Skeleton 💀', 'Witch 🧙‍♀️', 'Werewolf 🐺', 'Pumpkin 🎃', 'Bat 🦇', 'Frankenstein 🧟', 'Devil 😈', 'Grim Reaper 💀'],
    'Food 🍔': ['Hot Dog Suit 🌭', 'Banana 🍌', 'Cupcake 🧁', 'Pizza Slice 🍕', 'Taco 🌮', 'Donut 🍩'],
    'Historical 🏛️': ['Viking 🛡️', 'Pharaoh 🇪🇬', 'Caveman 🍖', 'Roman Soldier ⚔️', 'Cowboy 🤠', 'Ninja 🥷'],
    'Storybook 📖': ['Little Red Riding Hood 🐺', 'Big Bad Wolf 🐺', 'Prince Charming 👑', 'Pinocchio 🤥', 'Alice in Wonderland 🐰', 'Peter Pan 🧚']
};

const LOADING_MSG = "MAKING MAGIC...";

export default function DressUp() {
    const { currentUser } = useAuth();
    const [currentImage, setCurrentImage] = useState(null); // base64
    const [viewMode, setViewMode] = useState('main'); // 'main' | 'fashion' | 'accessories' | 'costumes'
    const [activeTab, setActiveTab] = useState('Roles 🕵️'); // Default to Roles since Costumes is now a drill-down
    const [page, setPage] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [zaps, setZaps] = useState(0);
    const [reels, setReels] = useState(0);
    const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
    const [userImages, setUserImages] = useState([]);
    const listenerRef = useRef(null);

    // Reset page when tab changes
    useEffect(() => {
        setPage(0);
    }, [activeTab]);

    // Fetch user's recent images for "Stickers"
    useEffect(() => {
        if (!currentUser) return;
        const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setZaps(data.zaps !== undefined ? data.zaps : (data.credits !== undefined ? data.credits : 0));
                setReels(data.reels || 0);
                setSubscriptionStatus(data.subscriptionStatus || 'inactive');
            }
        });

        const q = query(
            collection(db, 'generation_queue'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
        const unsubQueue = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserImages(docs);
        });

        return () => {
            unsubUser();
            unsubQueue();
            if (listenerRef.current) {
                listenerRef.current();
            }
        };
    }, [currentUser?.uid]);


    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            try {
                const compressed = await compressImage(base64, 1024, 0.8);
                setCurrentImage(compressed);
            } catch (err) {
                toast.error('Oops! Could not open that picture.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDefaultPick = async (type) => {
        setGenerating(true);
        try {
            const api = httpsCallable(functions, 'api');
            const result = await api({
                action: 'dressUp',
                prompt: `A cute, friendly photo of a ${type}, bright studio lighting, colorful background, high quality.`
            });

            if (result.data.image) {
                setCurrentImage(`data:image/png;base64,${result.data.image}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Oops! Something went wrong.");
        }
        setGenerating(false);
    };

    const handleHistoryPick = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => setCurrentImage(reader.result);
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error("Failed to load sticker:", err);
            toast.error("Could not peel that sticker! 😢");
        }
    };

    const handleTabClick = (tab) => {
        if (tab === 'Fashion 👗') {
            setViewMode('fashion');
            setActiveTab(Object.keys(FASHION_COLLECTION)[0]); // Default to first subcategory
        } else if (tab === 'Accessories 🕶️') {
            setViewMode('accessories');
            setActiveTab(Object.keys(ACCESSORIES_COLLECTION)[0]);
        } else if (tab === 'Costumes 🦸') {
            setViewMode('costumes');
            setActiveTab(Object.keys(COSTUMES_COLLECTION)[0]);
        } else {
            setActiveTab(tab);
        }
    };

    const handleBackToMain = () => {
        setViewMode('main');
        setActiveTab('Roles 🕵️'); // Fallback to Roles
    };

    const getCurrentItems = () => {
        if (viewMode === 'fashion') return FASHION_COLLECTION[activeTab] || [];
        if (viewMode === 'accessories') return ACCESSORIES_COLLECTION[activeTab] || [];
        if (viewMode === 'costumes') return COSTUMES_COLLECTION[activeTab] || [];
        return MAIN_CATEGORIES[activeTab] || [];
    };

    const handleDressUp = async (item) => {
        if (!currentImage) return toast.error("Pick a friend to dress up first!");

        setGenerating(true);

        try {
            const api = httpsCallable(functions, 'api');
            let prompt = "";

            // --- Costumes & Vibes ---
            if (activeTab.includes('Fantasy')) {
                prompt = `A magical photo of the subject dressed as a ${item}. Fantasy style, cute, high quality.`;
            } else if (activeTab.includes('Heroes')) {
                prompt = `A cool photo of the subject dressed as a ${item}. Sci-fi or superhero style, dynamic, high quality.`;
            } else if (activeTab.includes('Animals')) {
                prompt = `A cute photo of the subject wearing a ${item} costume. Fun, animal theme, high quality.`;
            } else if (activeTab.includes('Spooky')) {
                prompt = `A fun Halloween photo of the subject dressed as a ${item}. Spooky but cute, high quality.`;
            } else if (activeTab.includes('Vibes')) {
                prompt = `Make the image look like ${item}. Bright colors, fun atmosphere, kid-friendly.`;
            } else if (activeTab.includes('Roles')) {
                prompt = `Dress the subject as a ${item}. Cute uniform, props, friendly style.`;
            } else if (activeTab.includes('Backgrounds')) {
                prompt = `Change the background to a ${item}. Colorful, illustrated style but photorealistic lighting.`;
            }

            // --- Fashion ---
            else if (activeTab.includes('Tops')) {
                prompt = `A stylish photo of the subject wearing a ${item} on their torso. Modern fashion, cute style, high quality photoshoot.`;
            } else if (activeTab.includes('Bottoms')) {
                prompt = `A stylish photo of the subject wearing ${item} on their legs. Modern fashion, cute style, high quality photoshoot.`;
            } else if (activeTab.includes('Dresses')) {
                prompt = `A stylish photo of the subject wearing a ${item}. Modern fashion, cute style, high quality photoshoot.`;
            } else if (activeTab.includes('Outerwear')) {
                prompt = `A stylish photo of the subject wearing a ${item} over their clothes. Modern fashion, cute style.`;
            } else if (activeTab.includes('Footwear')) {
                prompt = `A stylish photo of the subject wearing ${item} on their feet. Modern fashion, cute style.`;
            } else if (activeTab.includes('Sleep') || activeTab.includes('Swim')) {
                prompt = `A cute photo of the subject wearing ${item}. Kid-friendly, comfy and fun style.`;
            }

            // --- Accessories ---
            else if (activeTab.includes('Headwear')) {
                prompt = `The subject wearing a ${item} on their head. Cute, well-fitted style.`;
            } else if (activeTab.includes('Eyewear')) {
                prompt = `The subject wearing ${item} on their eyes. Fun, stylish look.`;
            } else if (activeTab.includes('Jewelry')) {
                prompt = `The subject wearing a ${item}. Sparkly, cute accessory detail.`;
            } else if (activeTab.includes('Props')) {
                prompt = `The subject holding a ${item}. Happy, playful pose with the prop.`;
            }

            // --- Details ---
            else if (activeTab.includes('Hair')) {
                prompt = `The subject with ${item}. Keep the same face but change hair color to vibrant ${item}. High quality, realistic hair texture.`;
            } else if (activeTab.includes('Makeup')) {
                prompt = `The subject with ${item} on their face. Fun, kid-friendly face paint or makeup style. High quality, clear details.`;
            }

            const result = await api({
                action: 'dressUp',
                image: currentImage,
                prompt: prompt
            });

            // Expect requestId from queue-based backend
            const { requestId } = result.data;

            if (requestId) {
                // Poll/Listen for completion
                const unsubscribe = onSnapshot(doc(db, "generation_queue", requestId), (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        if (data.status === 'completed' && data.imageUrl) {
                            setCurrentImage(data.imageUrl); // Use the URL
                            toast.success("Ta-da! Look at that!", {
                                icon: '🎉',
                                style: { background: '#FFD700', color: '#000', fontWeight: 'bold' }
                            });
                            setGenerating(false);
                            unsubscribe();
                            listenerRef.current = null;
                        } else if (data.status === 'failed') {
                            setGenerating(false);
                            toast.error(`Magic failed: ${data.error || 'Unknown error'}`, { icon: '🪄' });
                            unsubscribe();
                            listenerRef.current = null;
                        }
                    }
                }, (error) => {
                    console.error("Queue listener error:", error);
                    setGenerating(false);
                    toast.error("Error tracking magic", { icon: '🪄' });
                    listenerRef.current = null;
                });
                listenerRef.current = unsubscribe;
            } else if (result.data.image) {
                // Fallback for old synchronous behavior (just in case)
                setCurrentImage(`data:image/png;base64,${result.data.image}`);
                toast.success("Ta-da! Look at that!", {
                    icon: '🎉',
                    style: { background: '#FFD700', color: '#000', fontWeight: 'bold' }
                });
                setGenerating(false);
            } else {
                throw new Error("No image generated");
            }
        } catch (error) {
            console.error(error);
            if (error.message.includes('Insufficient Zaps') || error.message.includes('resource-exhausted')) {
                toast("You need more Zaps ⚡ for this magic!", {
                    icon: '⚡',
                    style: { background: '#FFF3CD', color: '#856404', fontWeight: 'bold' }
                });
            } else {
                toast.error("Oh no! The magic failed. Try again!", { icon: '🪄' });
            }
            // Only stop generating if we didn't start a listener (listener handles it on success/fail)
            if (!error.message.includes('No Request ID')) {
                setGenerating(false);
            }
        }
    };

    return (
        <div className="playroom-layout">

            {/* LEFT: THE STAGE */}
            <div className="playroom-stage">

                {generating && (
                    <div className="magic-overlay">
                        <div className="magic-content">
                            {/* Wand icon instead of sparkles for "Creating" vibe */}
                            <Sparkles className="spinning-sparkle" size={80} strokeWidth={3} />
                            <h3 className="magic-text">
                                {LOADING_MSG}
                            </h3>
                        </div>
                    </div>
                )}

                {currentImage ? (
                    <div className="stage-content animate-pop">
                        <div className="paper-frame">
                            <img src={currentImage} alt="Subject" className="paper-doll-image" />
                        </div>

                        <button
                            onClick={() => setCurrentImage(null)}
                            className="btn-reset"
                            title="Start Over"
                        >
                            <RotateCcw size={24} />
                            <span>Start Over</span>
                        </button>
                    </div>
                ) : (
                    <div className="stage-empty animate-slide-up">
                        <div className="empty-title-container">
                            <h1 className="playful-title">
                                Magic Dress Up
                            </h1>
                            <p className="playful-subtitle">
                                Pick a friend to start playing!
                            </p>
                        </div>

                        {/* Recent User Stickers */}
                        {userImages.length > 0 && (
                            <div className="sticker-collection">
                                <h3 className="sticker-title">Who do you want to dress up? 🎭</h3>
                                <div className="sticker-scroll">
                                    {userImages.map(img => (
                                        <button
                                            key={img.id}
                                            className={`sticker-btn ${img.status === 'processing' ? 'processing' : ''}`}
                                            onClick={() => img.status === 'completed' && handleHistoryPick(img.imageUrl)}
                                            disabled={img.status === 'processing' || img.status === 'failed'}
                                            style={{ position: 'relative' }}
                                        >
                                            {img.status === 'completed' ? (
                                                <img src={img.thumbnailUrl || img.imageUrl} alt="Sticker" />
                                            ) : img.status === 'processing' ? (
                                                <div className="flex-center" style={{ width: '100%', height: '100%', background: '#27272a' }}>
                                                    <Sparkles className="animate-spin text-yellow-400" size={20} />
                                                </div>
                                            ) : (
                                                <div className="flex-center" style={{ width: '100%', height: '100%', background: '#27272a' }}>
                                                    <X className="text-red-500" size={20} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="action-buttons">
                            <label className="btn-big btn-primary">
                                <Camera size={24} />
                                <span>Upload Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>

                            <button onClick={() => handleDefaultPick('cute cat')} className="btn-big btn-secondary">
                                <Sparkles size={24} />
                                <span>Use a Cat</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: TOY CHEST */}
            <div className="toy-chest">
                <div className="chest-header">
                    <h2>Toy Box <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 'normal' }}>({zaps.toFixed(1)} Zaps)</span></h2>
                </div>

                <div className="tab-container">
                    {viewMode !== 'main' && (
                        <button
                            onClick={handleBackToMain}
                            className="tab-btn back-btn"
                            style={{ background: '#ffeaa7' }}
                        >
                            <ChevronLeft size={16} /> Wardrobe
                        </button>
                    )}

                    {viewMode === 'main' ? (
                        Object.keys(MAIN_CATEGORIES).map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab}
                            </button>
                        ))
                    ) : viewMode === 'fashion' ? (
                        Object.keys(FASHION_COLLECTION).map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab}
                            </button>
                        ))
                    ) : viewMode === 'accessories' ? (
                        Object.keys(ACCESSORIES_COLLECTION).map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab}
                            </button>
                        ))
                    ) : (
                        Object.keys(COSTUMES_COLLECTION).map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab}
                            </button>
                        ))
                    )}
                </div>

                <div className="items-grid">
                    {getCurrentItems()
                        .slice(page * 6, (page + 1) * 6)
                        .map((item, index) => (
                            <button
                                key={item}
                                className="grid-item-btn"
                                onClick={() => !generating && handleDressUp(item)}
                                disabled={generating}
                            >
                                <span className="item-label">{item}</span>
                            </button>
                        ))}
                </div>

                {/* Pagination Controls */}
                <div className="pagination-controls">
                    <button
                        className="btn-arrow"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <div className="page-dots">
                        {Array.from({ length: Math.max(1, Math.ceil((getCurrentItems().length || 0) / 6)) }).map((_, i) => (
                            <div key={i} className={`page-dot ${i === page ? 'active' : ''}`} />
                        ))}
                    </div>

                    <button
                        className="btn-arrow"
                        onClick={() => setPage(p => Math.min(Math.ceil((getCurrentItems().length || 0) / 6) - 1, p + 1))}
                        disabled={page >= Math.ceil((getCurrentItems().length || 0) / 6) - 1}
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>

        </div>
    );
}
