import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useLite } from '../contexts/LiteContext';
import RouteErrorBoundary from './RouteError';
import { lazyRetry } from '../lite-utils';

// Core LITE Pages
const ModelFeed = lazyRetry(() => import('../pages/ModelFeed'));
const Auth = lazyRetry(() => import('../pages/Auth'));
const Generator = lazyRetry(() => import('../pages/Generator'));
const UserProfile = lazyRetry(() => import('../pages/UserProfile'));
const NotFound = lazyRetry(() => import('../pages/NotFound'));

const PageLoader = () => (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#8b5cf6' }}>
        <div className="lite-loader">LITE</div>
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
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <ProfileRedirect />
                            </PrivateRoute>
                        } />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </RouteErrorBoundary>
            <style>{`
                .page-wrapper { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

const ProfileRedirect = () => {
    const { currentUser } = useLite();
    return <Navigate to={`/u/${currentUser?.uid}`} replace />;
};

export default AnimatedRoutes;
