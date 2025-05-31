import React from 'react';
import HeatmapBrushChart from '../components/HeatmapBrushChart';
import SearchTabs from '../components/SearchTabs';

const Draw: React.FC = () => {
    const handleSearch = () => {
        // Draw 페이지에서의 검색 로직
        console.log('Draw 페이지에서 검색 실행');
    }; return (
        <div className="w-full min-h-screen bg-base-100 flex flex-col">
            <div className="flex flex-1 p-4 gap-4">
                <SearchTabs onSearch={handleSearch} />

                <div className="flex-1 flex justify-center">
                    <div className="card bg-base-200 shadow-sm w-full max-w-6xl">
                        <div className="card-body p-6">
                            <div className="w-full">
                                <HeatmapBrushChart />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Draw;
