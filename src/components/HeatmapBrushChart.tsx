import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import {
    GridComponent,
    TooltipComponent,
    VisualMapComponent,
    BrushComponent,
    TitleComponent,
    ToolboxComponent
} from 'echarts/components';
import { HeatmapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

// ECharts에 필요한 컴포넌트 및 차트 등록
echarts.use([
    GridComponent,
    TooltipComponent,
    VisualMapComponent,
    BrushComponent,
    HeatmapChart,
    CanvasRenderer,
    ToolboxComponent,
    TitleComponent
]);



// Heatmap 데이터 타입
export type HeatmapDataItem = [number, number, number];

type BrushArea = {
    brushType: string;
    coordRange: [number, number][];
};

interface HeatmapBrushChartProps {
    initialData?: HeatmapDataItem[];
    xAxisData?: string[];
    yAxisData?: string[];
    selectedCells?: HeatmapDataItem[];
}

// 유틸리티 함수들
const createDefaultData = (xAxisLength: number, yAxisLength: number): HeatmapDataItem[] => {
    const data: HeatmapDataItem[] = [];
    for (let x = 0; x < xAxisLength; x++) {
        for (let y = 0; y < yAxisLength; y++) {
            data.push([x, y, 0]); // Math.floor(Math.random() * 15)]);
        }
    }
    return data;
};

const generateDefaultLabels = (count: number, prefix: string): string[] => {
    return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
};

const isSelectedCell = (cell: HeatmapDataItem, selectedCells: HeatmapDataItem[]): boolean => {
    return selectedCells.some(selected => selected[0] === cell[0] && selected[1] === cell[1]);
};

const getSelectedCellsFromBrush = (areas: BrushArea[], rawData: HeatmapDataItem[]): HeatmapDataItem[] => {
    const selectedCells: HeatmapDataItem[] = [];

    areas.forEach(area => {
        if (area.brushType === 'rect') {
            const [xRange, yRange] = area.coordRange;
            rawData.forEach(cell => {
                if (cell[0] >= xRange[0] && cell[0] <= xRange[1] &&
                    cell[1] >= yRange[0] && cell[1] <= yRange[1]) {
                    selectedCells.push([cell[0], cell[1], 1]);
                }
            });
        } else if (area.brushType === 'polygon') {
            const points = area.coordRange as [number, number][];
            rawData.forEach(cell => {
                if (points.some(point => point[0] === cell[0] && point[1] === cell[1])) {
                    selectedCells.push(cell);
                }
            });
        }
    });

    return selectedCells;
};

const HeatmapBrushChart: React.FC<HeatmapBrushChartProps> = ({
    initialData,
    xAxisData: initialXAxisData,
    yAxisData: initialYAxisData,
    selectedCells: initialSelectedCells = []
}) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<echarts.ECharts | null>(null);
    const selectedCellsRef = useRef<HeatmapDataItem[]>([...initialSelectedCells]);
    const [brushMode] = React.useState<'select' | 'delete'>('select');
    const [forceUpdate, setForceUpdate] = React.useState(0);

    // 초기 데이터 설정
    const yData = initialYAxisData || generateDefaultLabels(24, 'Y');
    const xData = initialXAxisData || generateDefaultLabels(7, 'X');
    const rawData = initialData || createDefaultData(7, 24);

    // 이벤트 핸들러
    const handleCellClick = (cell: HeatmapDataItem) => {
        const index = selectedCellsRef.current.findIndex(
            (c) => c[0] === cell[0] && c[1] === cell[1]
        );

        if (index === -1) {
            selectedCellsRef.current.push([cell[0], cell[1], 1]); // 선택된 셀에 1을 추가
        } else {
            selectedCellsRef.current.splice(index, 1);
        }

        updateChartSelection();
    }; const handleBrushSelect = (params: echarts.EChartsType['events']['brushEnd']) => {
        // brushEnd 이벤트에서는 areas 정보가 다르게 전달될 수 있음
        const areas = params.areas || (params.batch?.[0]?.areas);
        if (!areas || areas.length === 0) return;

        if (brushMode === 'select') {
            const newSelection = getSelectedCellsFromBrush(areas, rawData);
            selectedCellsRef.current = [...selectedCellsRef.current, ...newSelection];
        } else if (brushMode === 'delete') {
            const cellsToDelete = getSelectedCellsFromBrush(areas, rawData);

            // 선택된 셀들에서 삭제할 셀들을 제거
            selectedCellsRef.current = selectedCellsRef.current.filter(selectedCell =>
                !cellsToDelete.some(deleteCell =>
                    selectedCell[0] === deleteCell[0] && selectedCell[1] === deleteCell[1]
                )
            );
        }

        // 브러시 영역 클리어
        chartInstanceRef.current?.dispatchAction({
            type: 'brush',
            command: 'clear',
            areas: []
        });

        updateChartSelection();
    };

    // const handleBrushDelete = (params: any) => {
    //     // 삭제 모드에서 브러시로 선택한 영역의 셀들을 제거
    //     const areas = params.areas || (params.batch?.[0]?.areas);
    //     if (!areas || areas.length === 0) return;

    //     const cellsToDelete = getSelectedCellsFromBrush(areas, rawData);

    //     // 선택된 셀들에서 삭제할 셀들을 제거
    //     selectedCellsRef.current = selectedCellsRef.current.filter(selectedCell =>
    //         !cellsToDelete.some(deleteCell =>
    //             selectedCell[0] === deleteCell[0] && selectedCell[1] === deleteCell[1]
    //         )
    //     );

    //     updateChartSelection();
    // }; 
    const updateChartSelection = () => {
        chartInstanceRef.current?.setOption({
            series: [
                {
                    name: 'layout',
                    type: 'heatmap',
                    data: rawData,
                },
                {
                    type: 'heatmap',
                    data: selectedCellsRef.current,

                }
            ]
        });
        setForceUpdate(prev => prev + 1); // 테이블 리렌더링을 위한 상태 업데이트
    };

    // 개별 셀 삭제 함수
    const handleRemoveCell = (cellToRemove: HeatmapDataItem) => {
        selectedCellsRef.current = selectedCellsRef.current.filter(
            cell => !(cell[0] === cellToRemove[0] && cell[1] === cellToRemove[1])
        );
        updateChartSelection();
    };    // 모든 셀 삭제 함수
    const handleClearAll = () => {
        selectedCellsRef.current = [];

        // 브러시 영역 클리어
        chartInstanceRef.current?.dispatchAction({
            type: 'brush',
            command: 'clear',
            areas: []
        });

        // 브러시 도구 비활성화 (rect 선택 모드 해제)
        chartInstanceRef.current?.dispatchAction({
            type: 'takeGlobalCursor',
            key: 'brush',
            brushOption: {
                brushType: false
            }
        });

        updateChartSelection();
    };

    // 차트 초기화
    useEffect(() => {
        if (!chartRef.current) return;

        const chart = echarts.init(chartRef.current);
        chartInstanceRef.current = chart;        // 이벤트 리스너 설정
        chart.on('click', (params: any) => {
            if (params.componentType === 'series' && params.seriesType === 'heatmap') {
                const cell = params.data as HeatmapDataItem;
                handleCellClick(cell);
            }
        });

        chart.on('brushEnd', handleBrushSelect);

        // 초기 차트 설정
        chart.setOption({
            title: {
                text: 'Heatmap',
                left: 'center'
            },
            tooltip: {
                position: 'top',
                formatter: (params: any): string => {
                    const item = params.data as HeatmapDataItem;
                    const isSelected = isSelectedCell(item, selectedCellsRef.current);
                    return `${xData[item[0]]},${yData[item[1]]}${isSelected ? ' (Selected)' : ''}`;
                }
            },
            grid: {
                height: '80%',
                width: '90%',
                top: '10%',
                left: '5%',
                right: '5%'
            },
            xAxis: {
                type: 'category',
                data: xData,
                splitArea: { show: true }
            }, toolbox: {
                feature: {
                    myTool1: {
                        show: true,
                        title: 'Clear Selection',
                        icon: 'image://https://echarts.apache.org/en/images/favicon.png',
                        onclick: handleClearAll
                    }
                }
            },
            yAxis: {
                type: 'category',
                data: yData,
                splitArea: { show: true }
            },
            visualMap: {
                min: 0,
                max: 1,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '1%',
                type: 'piecewise',
                pieces: [
                    { value: 0, label: '전체', color: '#f5f5f5' },
                    { value: 1, label: '선택', color: 'royalblue' }
                ]
            },
            brush: {
                toolbox: ['rect'],
                xAxisIndex: 0,
                throttleType: 'debounce',
                throttleDelay: 300
            },
            series: [
                {
                    name: 'layout',
                    type: 'heatmap',
                    data: rawData,
                    label: { show: false },
                    emphasis: {
                        itemStyle: {
                            color: "darkgrey",
                        }
                    },
                    itemStyle: {
                        borderColor: 'grey',
                        borderWidth: 0.3
                    }
                },
                {
                    type: 'heatmap',
                    data: selectedCellsRef.current,
                    itemStyle: {
                        borderColor: 'blue',
                        opacity: 0.8,
                        borderWidth: 1
                    },
                    emphasis: {
                        itemStyle: {
                            color: 'deepskyblue',
                        }
                    }
                }
            ]
        });        // 클린업
        return () => {
            chart.off('brushEnd');
            chart.off('click');
            chart.dispose();
            chartInstanceRef.current = null;
        };
    }, []); return (
        <div className="w-full max-w-5xl mx-auto">
            <div ref={chartRef} className="w-full h-[480px] rounded-lg bg-base-100" />

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                        선택된 셀 ({selectedCellsRef.current.length}) {forceUpdate ? '' : ''}
                    </h3>
                    <button
                        onClick={handleClearAll}
                        className="btn btn-error btn-sm"
                        disabled={selectedCellsRef.current.length === 0}
                    >
                        전체 지우기
                    </button>
                </div>

                {selectedCellsRef.current.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table table-sm bg-base-100">
                            <thead>
                                <tr>
                                    <th>Index</th>
                                    <th>X({xData.length > 0 ? xData[0].replace(/\d+/, '') : 'X'})</th>
                                    <th>Y({yData.length > 0 ? yData[0].replace(/\d+/, '') : 'Y'})</th>
                                    <th className="w-20">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedCellsRef.current.map((cell, index) => (
                                    <tr key={`${cell[0]}-${cell[1]}-${index}`} className="hover">
                                        <td className="text-base-content/70">{index + 1}</td>
                                        <td className="font-medium">{xData[cell[0]]}</td>
                                        <td className="font-medium">{yData[cell[1]]}</td>
                                        <td>
                                            <button
                                                onClick={() => handleRemoveCell(cell)}
                                                className="btn btn-error btn-outline btn-xs rounded-full"
                                                title="Remove this cell"
                                            >
                                                ×
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="card bg-base-200">
                        <div className="card-body text-center py-12">
                            <p className="text-base-content/70">
                                선택된 셀이 없습니다. 히트맵에서 셀을 클릭하거나 브러시 도구를 사용하여 선택하세요.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeatmapBrushChart;