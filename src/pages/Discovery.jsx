import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import DiscoveryMobile from './DiscoveryMobile';
import DiscoveryDesktop from './DiscoveryDesktop';

export default function Discovery() {
    // Mobile Detection
    const isMobile = useIsMobile(768);

    if (isMobile) {
        return <DiscoveryMobile />;
    }

    return <DiscoveryDesktop />;
}
