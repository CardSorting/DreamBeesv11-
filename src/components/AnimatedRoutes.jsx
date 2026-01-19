import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import RouteErrorBoundary from './RouteErrorBoundary';

// Import Pages (Re-importing essentially what was in App.jsx)
// To avoid circular dependencies or massive imports, assuming we can just move the imports here 
// OR we can make this component accept children routes, but that's harder with AnimatePresence.
// Better to move the Route definitions here.

const Landing = React.lazy(() => import('../pages/Landing'));
const ModelFeed = React.lazy(() => import('../pages/ModelFeed'));
const Auth = React.lazy(() => import('../pages/Auth'));
const Generator = React.lazy(() => import('../pages/Generator'));
const MobileGenerator = React.lazy(() => import('../pages/MobileGenerator'));
const Gallery = React.lazy(() => import('../pages/Gallery'));

import { useIsMobile } from '../hooks/useIsMobile';
const Models = React.lazy(() => import('../pages/Models'));
const ImageDetail = React.lazy(() => import('../pages/ImageDetail'));
const ModelDetail = React.lazy(() => import('../pages/ModelDetail'));
const Features = React.lazy(() => import('../pages/Features'));
const Pricing = React.lazy(() => import('../pages/Pricing'));
const About = React.lazy(() => import('../pages/About'));
const Contact = React.lazy(() => import('../pages/Contact'));
const UserProfile = React.lazy(() => import('../pages/UserProfile'));
const BlogPost = React.lazy(() => import('../pages/BlogPost'));
const Blog = React.lazy(() => import('../pages/Blog'));
const KaraokeGenie = React.lazy(() => import('../pages/KaraokeGenie'));
const DressUp = React.lazy(() => import('../pages/DressUp'));
const Slideshow = React.lazy(() => import('../pages/Slideshow'));
const AppsHub = React.lazy(() => import('../pages/AppsHub'));
const PersonaChat = React.lazy(() => import('../pages/PersonaChat'));
const Discovery = React.lazy(() => import('../pages/Discovery'));
const ShowcaseDetail = React.lazy(() => import('../pages/ShowcaseDetail'));
const MockupStudio = React.lazy(() => import('../pages/MockupStudio'));
const MockupFeed = React.lazy(() => import('../pages/MockupFeed'));

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
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
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
                style={{ width: '100%', height: '100%' }}
            >
                <RouteErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<ModelFeed />} />
                            <Route path="/landing" element={<Landing />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <UserProfile />
                                </PrivateRoute>
                            } />

                            <Route path="/discovery" element={<Discovery />} />
                            <Route path="/discovery/:id" element={<ShowcaseDetail />} />
                            <Route path="/mockups" element={<MockupFeed />} />


                            {/* Admin Only Routes */}
                            <Route path="/generate" element={
                                <PrivateRoute>
                                    {isMobile ? <MobileGenerator /> : <Generator />}
                                </PrivateRoute>
                            } />
                            <Route path="/gallery" element={
                                <PrivateRoute><Gallery /></PrivateRoute>
                            } />
                            <Route path="/gallery/:id" element={
                                <PrivateRoute><ImageDetail /></PrivateRoute>
                            } />
                            <Route path="/models" element={
                                <PrivateRoute><Models /></PrivateRoute>
                            } />
                            <Route path="/model/:id" element={
                                <PrivateRoute><ModelDetail /></PrivateRoute>
                            } />
                            <Route path="/model/:id/feed" element={
                                <PrivateRoute><ModelFeed /></PrivateRoute>
                            } />

                            <Route path="/features" element={
                                <PrivateRoute><Features /></PrivateRoute>
                            } />
                            <Route path="/pricing" element={
                                <PrivateRoute><Pricing /></PrivateRoute>
                            } />
                            <Route path="/about" element={
                                <PrivateRoute><About /></PrivateRoute>
                            } />
                            <Route path="/contact" element={
                                <PrivateRoute><Contact /></PrivateRoute>
                            } />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route path="/cookies" element={<Cookies />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/blog/:id" element={<BlogPost />} />
                            <Route path="/careers" element={<Careers />} />
                            <Route path="/brand" element={<Brand />} />
                            <Route path="/api" element={<Api />} />
                            <Route path="/showcase" element={<Showcase />} />

                            <Route path="/apps" element={
                                <PrivateRoute><AppsHub /></PrivateRoute>
                            } />
                            <Route path="/karaoke" element={
                                <PrivateRoute><KaraokeGenie /></PrivateRoute>
                            } />
                            <Route path="/dressup" element={
                                <PrivateRoute><DressUp /></PrivateRoute>
                            } />
                            <Route path="/slideshow" element={<Slideshow />} />

                            {/* Apps */}
                            <Route path="/mockup-studio" element={
                                <PrivateRoute><MockupStudio /></PrivateRoute>
                            } />

                            <Route path="/chat/:id" element={
                                <PrivateRoute><PersonaChat /></PrivateRoute>
                            } />
                        </Routes>
                    </Suspense>
                </RouteErrorBoundary>
            </motion.div>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
