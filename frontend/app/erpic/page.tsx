'use client'

import dynamic from 'next/dynamic';

const GraphCanvas = dynamic(() => import('./GraphCanvas'), { ssr: false});

export default function Erpic() {
    return (
        <div style={{ height: '100vh' }}>
            <GraphCanvas />
        </div>
    );
}
