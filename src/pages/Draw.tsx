import React from 'react';
import HeatmapBrushChart from '../components/HeatmapBrushChart';

const Draw: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="mt-8">
                <HeatmapBrushChart />
            </div>
        </div>
    );
};

export default Draw;
