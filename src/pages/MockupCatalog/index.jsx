import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import './MockupCatalog.css';

import Breadcrumbs from './components/Breadcrumbs';
import CategoryGrid from './components/CategoryGrid';
import ItemGrid from './components/ItemGrid';
import CatalogSidebar from './components/CatalogSidebar';
import Pagination from './components/Pagination';
import { CATEGORY_MAPPING } from './categoryData';
import { useAuth } from '../../contexts/AuthContext';
import { slugify, unslugify } from './utils/slugs';

const ITEMS_PER_PAGE = 6; // Limit updated to 6 as requested

const MockupCatalog = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { categorySlug, subcategorySlug } = useParams();

    // Data State
    const [mockupItems, setMockupItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Navigation State derived from URL Slugs
    const activeCategory = categorySlug ? unslugify(categorySlug, Object.keys(CATEGORY_MAPPING)) : null;

    // For subcategories, we need to check all children lists
    const allSubcategories = Object.values(CATEGORY_MAPPING).flatMap(c => c.children);
    const activeSubcategory = subcategorySlug ? unslugify(subcategorySlug, allSubcategories) : null;

    const path = [];
    if (activeCategory) path.push(activeCategory);
    if (activeSubcategory) path.push(activeSubcategory);

    // Reset pagination on navigation change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, activeSubcategory]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const q = query(collection(db, 'mockup_items'), orderBy('label'));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMockupItems(items);
            } catch (error) {
                console.error("Error fetching mockup items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    // Helper to update URL using slugs
    const handleNavigation = (category, subcategory = null) => {
        let url = '/mockup-catalog';
        if (category) {
            url += `/${slugify(category)}`;
            if (subcategory) {
                url += `/${slugify(subcategory)}`;
            }
        }
        navigate(url);

        // Scroll to top of content on navigation (unless just pagination)
        window.scrollTo(0, 0);
    };

    const handleBreadcrumbNavigate = (crumb, index) => {
        if (crumb === null) {
            navigate('/mockup-catalog');
        } else {
            if (index === 0) {
                handleNavigation(path[0]);
            }
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        // User requested to retain viewport on pagination, so no scrollTo
    };

    const getPaginatedData = (data) => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return data.slice(startIndex, endIndex);
    };

    // Derived Display Logic
    const getCurrentView = () => {
        if (loading) return <div className="loading-spinner">Loading Catalog...</div>;

        // View: Subcategory Items (Level 2)
        if (activeSubcategory) {
            const allItems = mockupItems.filter(item => item.category === activeSubcategory);
            const paginatedItems = getPaginatedData(allItems);

            return (
                <div className="mc-view-section animate-in">
                    <div className="mc-section-header">
                        <h2>{activeSubcategory} Mockups</h2>
                        <span className="mc-count-badge">{allItems.length} Items</span>
                    </div>
                    <ItemGrid items={paginatedItems} onSelect={handleItemSelect} />
                    <Pagination
                        currentPage={currentPage}
                        totalItems={allItems.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={handlePageChange}
                    />
                </div>
            );
        }

        // View: Parent Category (Level 1)
        if (activeCategory) {
            const parentData = CATEGORY_MAPPING[activeCategory];
            if (!parentData) return <div>Category not found</div>;

            const allChildCategories = parentData.children.map(childName => ({
                name: childName,
                icon: mockupItems.find(i => i.category === childName)?.iconName || 'Box',
                count: mockupItems.filter(item => item.category === childName).length
            }));

            const paginatedCategories = getPaginatedData(allChildCategories);

            return (
                <div className="mc-view-section animate-in">
                    <div className="mc-section-header">
                        <h2>{activeCategory}</h2>
                        <p>{parentData.description}</p>
                    </div>
                    <CategoryGrid
                        categories={paginatedCategories}
                        onSelect={(cat) => handleNavigation(activeCategory, cat.name)}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalItems={allChildCategories.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={handlePageChange}
                    />
                </div>
            );
        }

        // View: Root (Level 0)
        const allCategories = Object.keys(CATEGORY_MAPPING).map(name => ({
            name,
            ...CATEGORY_MAPPING[name],
            count: mockupItems.filter(item =>
                CATEGORY_MAPPING[name].children.includes(item.category)
            ).length
        }));

        const paginatedCategories = getPaginatedData(allCategories);

        return (
            <div className="mc-view-section animate-in">
                {/* Hero Banner only on first page? Or always? Always is fine. */}
                <div className="mc-hero-banner">
                    <div className="mc-hero-content">
                        <h1>Create Premium Products</h1>
                        <p>Design, visualize, and sell with our professional mockup library.</p>
                        <button className="mc-hero-cta" onClick={() => handleNavigation('Home & Living')}>Start Designing</button>
                    </div>
                    <div className="mc-hero-visual">
                        <div className="mc-hero-circle"></div>
                    </div>
                </div>

                <div className="mc-section-header">
                    <h2>Browse Categories</h2>
                </div>
                <CategoryGrid
                    categories={paginatedCategories}
                    onSelect={(cat) => handleNavigation(cat.name)}
                />
                <Pagination
                    currentPage={currentPage}
                    totalItems={allCategories.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={handlePageChange}
                />
            </div>
        );
    };

    const handleItemSelect = (item) => {
        alert(`Selected: ${item.label} (Coming Soon: Item Generation)`);
    };

    return (
        <div className="mockup-catalog-layout">
            <CatalogSidebar
                activeParent={activeCategory}
                activeChild={activeSubcategory}
                onNavigate={handleNavigation}
            />

            <main className="mockup-catalog-main" id="catalog-content">
                <div className="mc-top-bar">
                    <Breadcrumbs path={path} onNavigate={handleBreadcrumbNavigate} />
                </div>

                <div className="mc-content-area">
                    {getCurrentView()}
                </div>
            </main>
        </div>
    );
};

export default MockupCatalog;
