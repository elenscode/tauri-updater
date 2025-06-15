import React from "react";
// import HeatmapBrushChart from "../components/HeatmapBrushChart";
import Heatmap from "../components/Heatmap";
import { usePatternStore } from "../store/usePatternStore";

const Draw: React.FC = () => {
  const { patternData, selectedData } = usePatternStore();

  return (
    <div className="w-full bg-base-100 flex flex-col">
      <div className="flex flex-1 p-4 gap-4">
        {/* Heatmap Chart */}
        <Heatmap layout={patternData} selectedCells={selectedData} />
      </div>
    </div>
  );
};

export default Draw;
