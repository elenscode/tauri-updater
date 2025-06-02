import React from 'react';
import HeatmapBrushChart from '../components/HeatmapBrushChart';
import SearchTabs from '../components/SearchTabs';
import SimilarityTable from '../components/SimilarityTable';
import { usePatternStore } from '../store/usePatternStore';

const Draw: React.FC = () => {
    const handleSearch = () => {
        // Draw 페이지에서의 검색 로직
        console.log('Draw 페이지에서 검색 실행');
    };
    const { patternData, selectedData, xAxisLabels, yAxisLabels, sourceImageIds } = usePatternStore();

    const handleImageSelect = (imageId: string) => {
        console.log('Selected image:', imageId);
        // 여기서 선택된 이미지에 대한 추가 작업을 수행할 수 있습니다
    };

    return (
        <div className="w-full min-h-screen bg-base-100 flex flex-col">
            <div className="flex flex-1 p-4 gap-4">
                <SearchTabs onSearch={handleSearch} />

                <div className="flex flex-1 gap-4 w-xl">
                    {/* Heatmap Chart */}
                    <div className="card bg-base-200 shadow-sm">
                        <div className="card-body p-6">
                            <div className="w-full">
                                <HeatmapBrushChart
                                    initialData={patternData}
                                    xAxisData={xAxisLabels}
                                    yAxisData={yAxisLabels}
                                    selectedCells={selectedData}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Similarity Table */}
                    <div className="card bg-base-200 shadow-sm">
                        <div className="card-body p-6">
                            <SimilarityTable
                                selectedImageIds={sourceImageIds}
                                onImageSelect={handleImageSelect}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Draw;
