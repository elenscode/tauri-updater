import React, { useState, useCallback, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { GridComponent, TooltipComponent, VisualMapComponent, BrushComponent, ToolboxComponent } from 'echarts/components';
import { HeatmapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([GridComponent, TooltipComponent, VisualMapComponent, HeatmapChart, CanvasRenderer, BrushComponent, ToolboxComponent]);

export type BrushMode = 'toggle' | 'selectRect' | 'deselectRect';

export interface HeatmapHandles {
  clearSelection: () => void;
}

interface HeatmapProps {
  data: Array<[number, number, number]>;
  xAxisLabels: string[];
  yAxisLabels: string[];
  brushOperatingMode: BrushMode;
}

const Heatmap = forwardRef<HeatmapHandles, HeatmapProps>(({ data, xAxisLabels, yAxisLabels, brushOperatingMode }, ref) => {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  const handleClearAllSelected = useCallback(() => {
    setSelectedCells(new Set());
  }, []);

  useImperativeHandle(ref, () => ({
    clearSelection: () => {
      handleClearAllSelected();
    }
  }));

  const handleBrushSelected = useCallback((params: any) => {
    if (!params.areas || params.areas.length === 0) {
      handleClearAllSelected();
      return;
    }

    let newSelectedCells = new Set(selectedCells);
    if (brushOperatingMode === 'selectRect') {
      newSelectedCells = new Set();
    }

    params.areas.forEach((area: any) => {
      if (area.brushType === 'rect' && area.coordRange) {
        const [minXIndex, maxXIndex, minYIndex, maxYIndex] = area.coordRange;
        data.forEach((item) => {
          const xIndex = item[0];
          const yIndex = item[1];
          const cellId = `${xIndex}-${yIndex}`;
          if (xIndex >= minXIndex && xIndex <= maxXIndex && yIndex >= minYIndex && yIndex <= maxYIndex) {
            if (brushOperatingMode === 'toggle') {
              if (newSelectedCells.has(cellId)) newSelectedCells.delete(cellId); else newSelectedCells.add(cellId);
            } else if (brushOperatingMode === 'selectRect') {
              newSelectedCells.add(cellId);
            } else if (brushOperatingMode === 'deselectRect') {
              if (newSelectedCells.has(cellId)) newSelectedCells.delete(cellId);
            }
          }
        });
      }
    });
    setSelectedCells(newSelectedCells);
  }, [data, selectedCells, brushOperatingMode, handleClearAllSelected]);

  const chartData = useMemo(() => {
    return data.map(item => {
      const cellId = `${item[0]}-${item[1]}`;
      if (selectedCells.has(cellId)) {
        return { value: item, itemStyle: { borderColor: 'rgba(0,0,0,1)', borderWidth: 2 }};
      }
      return { value: item, itemStyle: { borderColor: 'rgba(0,0,0,0.2)', borderWidth: 1 }};
    });
  }, [data, selectedCells]);

  const option = useMemo(() => {
    const values = data.map(item => item[2]);
    const visualMapMin = values.length > 0 ? Math.min(...values) : 0;
    const visualMapMax = values.length > 0 ? Math.max(...values) : 10;
    return {
      tooltip: {
        position: 'top',
        formatter: (p: any) => { const v = p.data.value || p.data; return `X: ${xAxisLabels[v[0]]}<br />Y: ${yAxisLabels[v[1]]}<br />Value: ${v[2]}`; }
      },
      grid: { height: '60%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: xAxisLabels, splitArea: { show: true }, axisLine: { show: true }, axisTick: { show: true } },
      yAxis: { type: 'category', data: yAxisLabels, splitArea: { show: true }, axisLine: { show: true }, axisTick: { show: true } },
      visualMap: { min: visualMapMin, max: visualMapMax, calculable: true, orient: 'horizontal', left: 'center', bottom: '5%' },
      toolbox: { show: true, feature: { brush: { type: ['rect', 'clear'] } }, right: 40, top: 10 },
      brush: { toolbox: ['rect', 'clear'], xAxisIndex: 0, brushStyle: { borderWidth: 2, color: 'rgba(0,0,0,0.1)', borderColor: 'rgba(0,0,0,0.5)' }},
      series: [{
        name: 'Heatmap Data', type: 'heatmap', data: chartData,
        label: { show: true, formatter: (p: any) => p.value[2] },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }}
      }]
    };
  }, [data, xAxisLabels, yAxisLabels, chartData]);

  const onEvents = { 'brushselected': handleBrushSelected };

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactECharts echarts={echarts} option={option} style={{ height: '100%', width: '100%' }} onEvents={onEvents} />
    </div>
  );
});

export default Heatmap;
