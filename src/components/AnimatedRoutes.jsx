import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import RouteErrorBoundary from './RouteErrorBoundary';

// Import lazyRetry utility
import { lazyRetry } from '../utils/lazyRetry';

const Landing = lazyRetry(() => import('../pages/Landing'));
const ModelFeed = lazyRetry(() => import('../pages/ModelFeed'));
const Auth = lazyRetry(() => import('../pages/Auth'));
const Generator = lazyRetry(() => import('../pages/Generator'));
const MobileGenerator = lazyRetry(() => import('../pages/MobileGenerator'));

import { useIsMobile } from '../hooks/useIsMobile';
const Models = lazyRetry(() => import('../pages/Models'));
const ImageDetail = lazyRetry(() => import('../pages/ImageDetail'));
const ModelDetail = lazyRetry(() => import('../pages/ModelDetail'));
const Features = lazyRetry(() => import('../pages/Features'));
const Pricing = lazyRetry(() => import('../pages/Pricing'));
const About = lazyRetry(() => import('../pages/About'));
const Contact = lazyRetry(() => import('../pages/Contact'));
const UserProfile = lazyRetry(() => import('../pages/UserProfile'));
const BlogPost = lazyRetry(() => import('../pages/BlogPost'));
const Blog = lazyRetry(() => import('../pages/Blog'));
const DressUp = lazyRetry(() => import('../pages/DressUp'));
const Slideshow = lazyRetry(() => import('../pages/Slideshow'));
const AppsHub = lazyRetry(() => import('../pages/AppsHub'));
const PersonaChat = lazyRetry(() => import('../features/persona-live/PersonaChat'));

const ShowcaseDetail = lazyRetry(() => import('../pages/ShowcaseDetail'));
const MockupStudio = lazyRetry(() => import('../pages/MockupStudio'));
const MockupFeed = lazyRetry(() => import('../pages/MockupFeed'));
const MockupCatalog = lazyRetry(() => import('../pages/MockupCatalog'));
const MockupProductPage = lazyRetry(() => import('../pages/MockupCatalog/MockupProductPage'));
const MemeFormatter = lazyRetry(() => import('../pages/MemeFormatter'));
const MemeFeed = lazyRetry(() => import('../pages/MemeFeed'));
const PublicGenerationsFeed = lazyRetry(() => import('../pages/PublicGenerationsFeed'));
const EditStudio = lazyRetry(() => import('../pages/EditStudio'));
const CommunitySafety = lazyRetry(() => import('../pages/safety'));
const QuickMockups = lazyRetry(() => import('../pages/QuickMockups'));
const QuickMockupCreator = lazyRetry(() => import('../pages/QuickMockups/MockupCreator'));
const NotFound = lazyRetry(() => import('../pages/NotFound'));
const Maintenance = lazyRetry(() => import('../pages/Maintenance'));
const AccessDenied = lazyRetry(() => import('../pages/AccessDenied'));
const Offline = lazyRetry(() => import('../pages/Offline'));
const AutoCSV = lazyRetry(() => import('../pages/AutoCSV/AutoCSV'));
const MeowAccTransformer = lazyRetry(() => import('../pages/MeowAccTransformer/MeowAccTransformer'));
const ColorCraft = lazyRetry(() => import('../apps/color-craft/ColorCraft'));
const AvatarForgeLayout = lazyRetry(() => import('../pages/AvatarForge/AvatarForgeLayout'));
const AvatarForgeRequest = lazyRetry(() => import('../pages/AvatarForge/AvatarForgeRequest'));
const AvatarForgeMint = lazyRetry(() => import('../pages/AvatarForge/AvatarForgeMint'));
const AvatarForgeFloor = lazyRetry(() => import('../pages/AvatarForge/AvatarForgeFloor'));

// Twitch Platform Components
const TwitchLayout = lazyRetry(() => import('../features/persona-live/TwitchLayout'));
const BrowsePage = lazyRetry(() => import('../features/persona-live/BrowsePage'));
const FollowingPage = lazyRetry(() => import('../features/persona-live/FollowingPage'));
const CategoryDirectory = lazyRetry(() => import('../features/persona-live/CategoryDirectory'));

import { Privacy, Terms, Cookies } from '../pages/Legal';
import { Careers, Brand, Api, Showcase } from '../pages/Misc';

// Loading Component
const PageLoader = () => (
    <div style={{
        height: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)'
    }}>
        <div className="loading-pulse">Loading...</div>
    </div>
);

function PrivateRoute({ children }) {
    const { currentUser } = useAuth();
    return currentUser ? children : <Navigate to="/auth" />;
}



const pageTransition = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const AnimatedRoutes = () => {
    const location = useLocation();
    const isMobile = useIsMobile();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageTransition}
                style={{ width: '100%', height: '100%', background: '#000' }}
            >
                <RouteErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<ModelFeed />} />
                            <Route path="/filter/:filter" element={<ModelFeed />} />
                            <Route path="/landing" element={<Landing />} />
                            <Route path="/auth" element={<Auth />} />

                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <UserProfile />
                                </PrivateRoute>
                            } />
                            <Route path="/profile/:tab" element={
                                <PrivateRoute>
                                    <UserProfile />
                                </PrivateRoute>
                            } />


                            <Route path="/mockups" element={<MockupFeed />} />
                            <Route path="/mockups/tag/:tag" element={<MockupFeed />} />
                            <Route path="/mockups/creator/:userId" element={<MockupFeed />} />

                            <Route path="/memes" element={<MemeFeed />} />
                            <Route path="/memes/creator/:userId" element={<MemeFeed />} />
                            <Route path="/generations" element={<PublicGenerationsFeed />} />
                            <Route path="/generations/view" element={<PublicGenerationsFeed />} />
                            <Route path="/safety" element={<CommunitySafety />} />

                            {/* Admin Only Routes */}
                            <Route path="/generate" element={
                                <PrivateRoute>
                                    {isMobile ? <MobileGenerator /> : <Generator />}
                                </PrivateRoute>
                            } />

                            <Route path="/gallery" element={<Navigate to="/profile" replace />} />
                            <Route path="/gallery/filter/:filterMode" element={<Navigate to="/profile" replace />} />

                            <Route path="/gallery/:id" element={
                                <PrivateRoute><ImageDetail /></PrivateRoute>
                            } />
                            <Route path="/models" element={<Models />} />
                            <Route path="/model/:id" element={<ModelDetail />} />
                            <Route path="/model/:id/feed" element={
                                <PrivateRoute><ModelFeed /></PrivateRoute>
                            } />
                            <Route path="/model/:id/feed/filter/:filter" element={
                                <PrivateRoute><ModelFeed /></PrivateRoute>
                            } />

                            <Route path="/features" element={<Features />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route path="/cookies" element={<Cookies />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/blog/:id" element={<BlogPost />} />
                            <Route path="/careers" element={<Careers />} />
                            <Route path="/brand" element={<Brand />} />
                            <Route path="/api" element={<Api />} />
                            <Route path="/showcase" element={<Showcase />} />

                            <Route path="/apps" element={<AppsHub />} />
                            <Route path="/dressup" element={
                                <PrivateRoute><DressUp /></PrivateRoute>
                            } />
                            <Route path="/slideshow" element={<Slideshow />} />

                            {/* Apps */}
                            <Route path="/mockup-studio" element={
                                <PrivateRoute><MockupStudio /></PrivateRoute>
                            } />
                            <Route path="/mockup-catalog" element={
                                <PrivateRoute><MockupCatalog /></PrivateRoute>
                            } />
                            <Route path="/mockup-catalog/:categorySlug" element={
                                <PrivateRoute><MockupCatalog /></PrivateRoute>
                            } />
                            <Route path="/mockup-catalog/:categorySlug/:subcategorySlug" element={
                                <PrivateRoute><MockupCatalog /></PrivateRoute>
                            } />
                            <Route path="/mockup-catalog/item/:itemId" element={
                                <PrivateRoute><MockupProductPage /></PrivateRoute>
                            } />

                            <Route path="/meme-formatter" element={
                                <PrivateRoute><MemeFormatter /></PrivateRoute>
                            } />

                            <Route path="/quick-mockups" element={
                                <PrivateRoute><QuickMockups /></PrivateRoute>
                            } />
                            <Route path="/quick-mockups/:itemId" element={
                                <PrivateRoute><QuickMockupCreator /></PrivateRoute>
                            } />

                            <Route path="/edit/:id" element={
                                <PrivateRoute><EditStudio /></PrivateRoute>
                            } />

                            {/* Twitch Platform Routes */}
                            <Route element={<TwitchLayout />}>
                                <Route path="/browse" element={<BrowsePage />} />
                                <Route path="/directory" element={<CategoryDirectory />} />
                                <Route path="/following" element={<PrivateRoute><FollowingPage /></PrivateRoute>} />
                                <Route path="/channel/:id" element={<PrivateRoute><PersonaChat /></PrivateRoute>} />
                            </Route>

                            <Route path="/autocsv" element={
                                <PrivateRoute><AutoCSV /></PrivateRoute>
                            } />

                            <Route path="/meowacc" element={
                                <PrivateRoute><MeowAccTransformer /></PrivateRoute>
                            } />

                            <Route path="/color-craft" element={
                                <PrivateRoute><ColorCraft /></PrivateRoute>
                            } />

                            <Route path="/avatar" element={
                                <PrivateRoute><AvatarForgeLayout /></PrivateRoute>
                            }>
                                <Route index element={<Navigate to="forge" replace />} />
                                <Route path="forge" element={<AvatarForgeRequest />} />
                                <Route path="mint" element={<AvatarForgeMint />} />
                                <Route path="floor" element={<AvatarForgeFloor />} />
                            </Route>

                            <Route path="/maintenance" element={<Maintenance />} />
                            <Route path="/forbidden" element={<AccessDenied />} />
                            <Route path="/offline" element={<Offline />} />

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </RouteErrorBoundary>
            </motion.div>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
