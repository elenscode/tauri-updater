import React from 'react';
import HeatmapBrushChart from '../components/HeatmapBrushChart';
import SearchTabs from '../components/SearchTabs';
import { usePatternStore } from '../store/usePatternStore';

const Draw: React.FC = () => {

    const { patternData, selectedData, xAxisLabels, yAxisLabels } = usePatternStore();


    return (
        <div className="w-full bg-base-100 flex flex-col">
            <div className="flex flex-1 p-4 gap-4">
                <SearchTabs />

                <div className="flex flex-1 gap-4 w-xl">
                    {/* Heatmap Chart */}
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
