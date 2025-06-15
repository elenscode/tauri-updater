import React from "react";
// import HeatmapBrushChart from "../components/HeatmapBrushChart";
import Heatmap from "../components/Heatmap";
import { usePatternStore } from "../store/usePatternStore";
import SimDataGrid from "../components/SimDataGrid";

const Draw: React.FC = () => {
  const { patternData, selectedData } = usePatternStore();

  return (
    <div className="w-full bg-base-100 flex flex-col">
      <div className="flex flex-1 p-4 gap-4">
        {/* Heatmap Chart */}
        <div className="flex">
          <Heatmap layout={patternData} selectedCells={selectedData} />
        </div>
        <div className="flex flex-1">
          <SimDataGrid />
        </div>
      </div>
    </div>
  );
};

export default Draw;
