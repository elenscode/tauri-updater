import React from 'react';
import HeatmapBrushChart from '../components/HeatmapBrushChart';

const Draw: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-base-content mb-4">그리기 페이지</h1>
                <p className="text-lg text-base-content/70">아직 구현되지 않은 페이지입니다.</p>
                <div className="mt-8">
                    <div className="skeleton h-32 w-full max-w-md mx-auto"></div>
                    <HeatmapBrushChart />
                </div>
            </div>
        </div>
    );
};

export default Draw;
