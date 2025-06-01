import { create } from 'zustand';
import { devtools } from 'zustand/middleware'
import { HeatmapDataItem } from '../components/HeatmapBrushChart';


interface PatternStore {
    // 패턴 데이터
    patternData: HeatmapDataItem[];
    selectedData: HeatmapDataItem[];
    xAxisLabels: string[];
    yAxisLabels: string[];
    threshold: number;

    // 생성된 패턴 메타데이터
    sourceImageIds: string[];
    createdAt: Date | null;

    // Actions
    setPatternData: (data: HeatmapDataItem[], xLabels: string[], yLabels: string[]) => void;
    setThreshold: (threshold: number) => void;
    clearPattern: () => void;
    generatePatternFromImages: (imageIds: string[], threshold: number) => Promise<void>;
}

export const usePatternStore = create<PatternStore>()(
    devtools((set) => ({
        // Initial state
        patternData: [],
        selectedData: [],
        xAxisLabels: [],
        yAxisLabels: [],
        threshold: 300, // 기본 threshold 값
        sourceImageIds: [],
        createdAt: null,

        // Actions
        setPatternData: (data, xLabels, yLabels) => set({
            patternData: data,
            xAxisLabels: xLabels,
            yAxisLabels: yLabels,
            createdAt: new Date(),
        }),

        setThreshold: (threshold) => set({ threshold }),

        clearPattern: () => set({
            patternData: [],
            xAxisLabels: [],
            yAxisLabels: [],
            sourceImageIds: [],
            createdAt: null,
        }),

        generatePatternFromImages: async (imageIds: string[], threshold: number) => {
            try {
                // fetchPointData import
                const { fetchPointData } = await import('../api/imageGenerator');

                // 모든 이미지의 포인트 데이터를 fetch
                const allPointDataPromises = imageIds.map(id => fetchPointData(id));
                const allPointData = await Promise.all(allPointDataPromises);

                // 데이터 통합 및 패턴 생성
                const combinedData = allPointData.flat();
                // 축 레이블 생성 (데이터에서 x, y 범위 추출)
                const xValues = [...new Set(combinedData.map(p => p.x))].sort((a, b) => a - b);
                const yValues = [...new Set(combinedData.map(p => p.y))].sort((a, b) => a - b);

                const xMin = Math.min(...xValues);
                const yMin = Math.min(...yValues);


                const patternData: HeatmapDataItem[] = [];
                const selectedData: HeatmapDataItem[] = [];
                combinedData.forEach(point => {
                    const adjustedX = point.x - xMin; // x 값을 최소값으로 조정
                    const adjustedY = point.y - yMin; // y 값을 최소값으로 조정
                    const value = parseFloat(point.value);

                    if (value >= threshold) {
                        patternData.push([adjustedX, adjustedY, 0]);
                        selectedData.push([adjustedX, adjustedY, 1]);
                    } else {
                        patternData.push([adjustedX, adjustedY, 0]);
                    }
                });


                const xLabels = xValues.map(x => `X${x}`);
                const yLabels = yValues.map(y => `Y${y}`);

                set({
                    patternData,
                    selectedData,
                    xAxisLabels: xLabels,
                    yAxisLabels: yLabels,
                    threshold,
                    sourceImageIds: imageIds,
                    createdAt: new Date(),
                });
            } catch (error) {
                console.error('패턴 생성 중 오류 발생:', error);
                throw error;
            }
        },
    }))
);
