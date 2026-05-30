/**
 * [LAYER: INFRASTRUCTURE]
 */
import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useLite } from '../contexts/LiteContext';
import RouteErrorBoundary from './RouteError';
import { lazyRetry } from '../lite-utils';
import './AnimatedRoutes.css';

// Core LITE Pages
const ModelFeed = lazyRetry(() => import('../pages/ModelFeed'));
const Auth = lazyRetry(() => import('../pages/Auth'));
const Generator = lazyRetry(() => import('../pages/Generator'));
const UserProfile = lazyRetry(() => import('../pages/UserProfile'));
const GenerationDetail = lazyRetry(() => import('../pages/GenerationDetail'));
const NotFound = lazyRetry(() => import('../pages/NotFound'));

const PageLoader = () => (
    <div className="page-route-loader">
        <div className="lite-loader-brand">LITE</div>
        <div className="shimmer-container">
            <div className="shimmer-bar" />
        </div>
    </div>
);

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useLite();
    if (loading) return <PageLoader />;
    return currentUser ? children : <Navigate to="/auth" />;
}

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <div className="page-wrapper" key={location.pathname}>
            <RouteErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                    <Routes location={location}>
                        <Route path="/" element={<ModelFeed />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/generate" element={
                            <PrivateRoute>
                                <Generator />
                            </PrivateRoute>
                        } />
                        <Route path="/u/:id" element={<UserProfile />} />
                        <Route path="/generation/:id" element={<GenerationDetail />} />
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <ProfileRedirect />
                            </PrivateRoute>
                        } />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </RouteErrorBoundary>
        </div>
    );
};

const ProfileRedirect = () => {
    const { currentUser } = useLite();
    return <Navigate to={`/u/${currentUser?.uid}`} replace />;
};

export default AnimatedRoutes;
