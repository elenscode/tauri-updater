// import { PointData } from '../types/image';
import { HeatmapDataItem } from '../components/HeatmapBrushChart';

/**
 * 포인트 데이터에 threshold를 적용하여 0과 1로 변환하는 함수
 * @param pointData - 원본 포인트 데이터 배열
 * @param threshold - 임계값 (이 값 이상이면 1, 미만이면 0)
 * @returns PatternData 배열 (value는 0 또는 1)
 */
export const applyThresholdToBinaryPattern = (
    pointData: HeatmapDataItem[],
    threshold: number
): HeatmapDataItem[] => {
    return pointData.map(point => ([
        point[0], // x
        point[1], // y
        point[2] >= threshold ? 1 : 0
    ]));
};

// /**
//  * 여러 이미지의 포인트 데이터를 통합하여 평균값을 계산하는 함수
//  * @param allPointData - 모든 이미지의 포인트 데이터 배열
//  * @returns 통합된 포인트 데이터 (평균값)
//  */
// export const combinePointDataWithAverage = (allPointData: PointData[][]): PointData[] => {
//     const pointMap = new Map<string, { values: number[], x: number, y: number }>();

//     // 모든 포인트 데이터를 좌표별로 그룹화
//     allPointData.forEach(imageData => {
//         imageData.forEach(point => {
//             const key = `${point.x},${point.y}`;
//             if (!pointMap.has(key)) {
//                 pointMap.set(key, { values: [], x: point.x, y: point.y });
//             }
//             pointMap.get(key)!.values.push(parseFloat(point.value));
//         });
//     });

//     // 각 좌표에서 평균값 계산
//     const combinedData: PointData[] = [];
//     pointMap.forEach(({ values, x, y }) => {
//         const average = values.reduce((sum, val) => sum + val, 0) / values.length;
//         combinedData.push({
//             x,
//             y,
//             value: average.toString()
//         });
//     });

//     return combinedData;
// };

// /**
//  * PatternData를 히트맵에서 사용할 수 있는 형태로 변환
//  * @param patternData - 패턴 데이터
//  * @returns 히트맵용 데이터 [x, y, value] 형태
//  */
// export const convertPatternToHeatmapData = (patternData: PatternData[]): [number, number, number][] => {
//     return patternData.map(point => [point.x, point.y, point.value]);
// };

// /**
//  * x, y 좌표 범위에서 축 레이블 생성
//  * @param values - 좌표값 배열
//  * @param prefix - 레이블 접두사 ('X' 또는 'Y')
//  * @returns 축 레이블 배열
//  */
// export const generateAxisLabels = (values: number[], prefix: string): string[] => {
//     const sortedValues = [...new Set(values)].sort((a, b) => a - b);
//     return sortedValues.map(val => `${prefix}${val}`);
// };

// /**
//  * 패턴 데이터의 통계 정보 계산
//  * @param patternData - 패턴 데이터
//  * @returns 통계 정보 객체
//  */
// export const calculatePatternStatistics = (patternData: PatternData[]) => {
//     const totalCells = patternData.length;
//     const activeCells = patternData.filter(point => point.value === 1).length;
//     const inactiveCells = totalCells - activeCells;
//     const activePercentage = totalCells > 0 ? (activeCells / totalCells) * 100 : 0;

//     return {
//         totalCells,
//         activeCells,
//         inactiveCells,
//         activePercentage: Math.round(activePercentage * 100) / 100
//     };
// };
