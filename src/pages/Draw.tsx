import React from 'react';
import HeatmapBrushChart from '../components/HeatmapBrushChart';
import SearchTabs from '../components/SearchTabs';
import { usePatternStore } from '../store/usePatternStore';

const Draw: React.FC = () => {
    const handleSearch = () => {
        // Draw 페이지에서의 검색 로직
        console.log('Draw 페이지에서 검색 실행');
    };
    const { patternData, selectedData, xAxisLabels, yAxisLabels } = usePatternStore();
    return (
        <div className="w-full h-full bg-base-100 flex flex-col overflow-hidden">
            <div className="flex flex-1 p-4 gap-4 overflow-hidden">
                <SearchTabs onSearch={handleSearch} />

                <div className="flex flex-1 gap-4 w-xl overflow-auto">{/* Heatmap Chart */}
                    <div className="card bg-base-200 shadow-sm w-md">
                        <div className="card-body p-6">
                            <HeatmapBrushChart
                                initialData={patternData}
                                xAxisData={xAxisLabels}
                                yAxisData={yAxisLabels}
                                selectedCells={selectedData}
                            />
                        </div>

                    </div>


                </div>
            </div>
        </div>
    );
};

export default Draw;
