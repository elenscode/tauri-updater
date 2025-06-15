import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PointData } from "../types/image";

interface PatternStore {
  // 패턴 데이터
  patternData: PointData[];
  selectedData: Set<string>;
  threshold: number;

  // 생성된 패턴 메타데이터
  sourceImageIds: string[];

  // Actions
  setPatternData: (
    data: PointData[],
    xLabels: string[],
    yLabels: string[]
  ) => void;
  setThreshold: (threshold: number) => void;
  clearPattern: () => void;
  generatePatternFromImages: (
    imageIds: string[],
    threshold: number,
    binaryOptions?: { selectedValues: number[]; isBinary: boolean }
  ) => Promise<void>;
}

export const usePatternStore = create<PatternStore>()(
  devtools((set) => ({
    // Initial state
    patternData: [],
    selectedData: [],
    sourceImageIds: [],
    threshold: 0,
    // Actions
    setPatternData: (data) =>
      set({
        patternData: data,
      }),

    setThreshold: (threshold) => set({ threshold }),

    clearPattern: () =>
      set({
        patternData: [],
        selectedData: new Set(),
        sourceImageIds: [],
      }),
    generatePatternFromImages: async (
      imageIds: string[],
      threshold: number,
      binaryOptions?: { selectedValues: number[]; isBinary: boolean }
    ) => {
      try {
        // fetchPointData import
        const { fetchPointData } = await import("../api/imageGenerator");

        // 모든 이미지의 포인트 데이터를 fetch
        const allPointDataPromises = imageIds.map(async (id) => {
          const pointData = await fetchPointData(id);

          // 이진화 모드인 경우 이진화 처리된 데이터 사용
          if (binaryOptions?.isBinary) {
            console.log(
              `이진화 처리 중: 이미지 ${id}, 선택된 BIN: ${binaryOptions.selectedValues.join(
                ","
              )}`
            );
            return pointData.map((point) => {
              const value = point.value;
              const isInSelectedBins =
                binaryOptions.selectedValues.includes(value);
              return {
                ...point,
                value: isInSelectedBins ? value : 0,
              };
            });
          }

          return pointData;
        });
        const allPointData = await Promise.all(allPointDataPromises);

        // 데이터 통합 및 패턴 생성
        const combinedData = allPointData.flat();

        /*combinedData 를 순회하면서 x,y 좌표만 비교하여 중복은 제거하여 {x,y,value:0} 으로 patternData 생성
         * 순회 과정에서 value값이 0 이 아닌 경우를 모아서 selectedData를 생성
         */
        const selectedData: Set<string> = new Set();
        const pointMap = new Map<string, PointData>();
        combinedData.forEach((point) => {
          const key = `${point.x}-${point.y}`;
          if (!pointMap.has(key)) {
            pointMap.set(key, { x: point.x, y: point.y, value: 0 });
            // pointMap.set(key, { ...point });
          }
          const existingPoint = pointMap.get(key)!;
          existingPoint.value += point.value;

          // value가 threshold 이상인 경우 selectedData에 추가
          if (point.value > threshold) {
            selectedData.add(key);
          }
        });
        const patternData: PointData[] = Array.from(pointMap.values()).map(
          (point) => ({ ...point })
        );

        set({
          patternData,
          selectedData,
          threshold,
          sourceImageIds: imageIds,
        });
      } catch (error) {
        console.error("패턴 생성 중 오류 발생:", error);
        throw error;
      }
    },
  }))
);
