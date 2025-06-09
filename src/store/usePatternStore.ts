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
    generatePatternFromImages: (imageIds: string[], threshold: number, binaryOptions?: { selectedValues: number[]; isBinary: boolean }) => Promise<void>;
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
        }), generatePatternFromImages: async (imageIds: string[], threshold: number, binaryOptions?: { selectedValues: number[]; isBinary: boolean }) => {
            try {
                // fetchPointData import
                const { fetchPointData } = await import('../api/imageGenerator');

                // 모든 이미지의 포인트 데이터를 fetch
                const allPointDataPromises = imageIds.map(async (id) => {
                    const pointData = await fetchPointData(id);

                    // 이진화 모드인 경우 이진화 처리된 데이터 사용
                    if (binaryOptions?.isBinary) {
                        console.log(`이진화 처리 중: 이미지 ${id}, 선택된 BIN: ${binaryOptions.selectedValues.join(',')}`);
                        // 이진화 옵션을 사용하여 포인트 데이터 필터링/변환
                        return pointData.map(point => {
                            const value = parseFloat(point.value);
                            // 선택된 BIN 값들에 해당하는 경우만 유지, 나머지는 0으로 처리
                            const isInSelectedBins = binaryOptions.selectedValues.includes(value);
                            return {
                                ...point,
                                value: isInSelectedBins ? value.toString() : '0'
                            };
                        });
                    }

                    return pointData;
                });
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
                }); const xLabels = xValues.map(x => `X${x}`);
                const yLabels = yValues.map(y => `Y${y}`);

                console.log(`패턴 생성 완료: ${binaryOptions?.isBinary ? '이진화 모드' : '일반 모드'}, 총 ${combinedData.length}개 포인트, 활성 패턴 ${selectedData.length}개`);

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
