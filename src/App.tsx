import React, { Suspense, useCallback, useState, useRef } from "react"; // Added useRef
import "./App.css";
import { fetchImageMetadata } from './api/imageGenerator';
import ImageGrid from "./components/ImageGrid";
import DataGrid from "./components/DataGrid";
import { useImageDataStore } from './store/useImageDataStore';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import Heatmap, { BrushMode, HeatmapHandles } from "./components/Heatmap"; // Import Heatmap, BrushMode, HeatmapHandles

function App() {
  const {
    filteredImages,
    filteredTotalCount,
    searchResults,
    selectedGridItems,
    cacheVersion,
    setImageData,
    applyFilter
  } = useImageDataStore();

  const fetchData = useCallback(async () => {
    try {
      const { totalCount, images } = await fetchImageMetadata();
      setImageData(totalCount, images);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }, [setImageData]);
  const handleDraw = useCallback(() => {
    applyFilter();
  }, [applyFilter]);
  const [showDataGrid, setShowDataGrid] = useState(true);

  // State and ref for Heatmap
  const [brushOperatingMode, setBrushOperatingMode] = useState<BrushMode>('toggle');
  const heatmapRef = useRef<HeatmapHandles>(null);

  const sampleHeatmapData: Array<[number, number, number]> = [
    [0, 0, 5], [0, 1, 7], [0, 2, 3], [0, 3, 9], [0, 4, 2],
    [1, 0, 1], [1, 1, 4], [1, 2, 6], [1, 3, 5], [1, 4, 8],
    [2, 0, 8], [2, 1, 2], [2, 2, 9], [2, 3, 1], [2, 4, 4],
    [3, 0, 3], [3, 1, 5], [3, 2, 2], [3, 3, 7], [3, 4, 6],
    [4, 0, 6], [4, 1, 9], [4, 2, 1], [4, 3, 3], [4, 4, 5],
  ];
  const sampleXAxisLabels = ['Val A', 'Val B', 'Val C', 'Val D', 'Val E'];
  const sampleYAxisLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const handleHeatmapClear = () => {
    heatmapRef.current?.clearSelection();
  };

  return (
    <main className="w-full max-w-none">
      <Suspense fallback={<div>Loading...</div>}>
        <div className="w-full h-[900px] flex-col justify-center items-center gap-2.5">
          <div className="h-10 relative" />
          <div className="flex flex-1 p-2.5 justify-start items-start gap-2.5">
            <div className="w-72 inline-flex flex-col justify-start items-center gap-2.5">
              {/* ... tabs ... */}
              <div className="self-stretch inline-flex justify-start items-center overflow-hidden">
                <div className="tabs tabs-lift">
                  <input type="radio" name="my_tabs_3" className="tab" aria-label="일반 검색" defaultChecked />
                  <div className="tab-content  bg-base-100 border-base-300 p-6">
                    <div className="self-stretch p-[5px] flex flex-col justify-start items-start gap-2.5 overflow-hidden">


                      <div className="justify-start text-lg font-bold ">기간</div>
                      <label className="input input-info">
                        <span className="label">시작</span>
                        <input type="date" defaultValue="2025-05-01" />
                      </label>
                      <label className="input input-info">
                        <span className="label">종료</span>
                        <input type="date" defaultValue="2025-05-10" />
                      </label>
                      <div className="justify-start text-lg font-bold ">파트(옵션)</div>
                      <label className="input input-info">
                        <input type="text" />
                      </label>
                      <button className="btn" onClick={fetchData}>검색</button>

                    </div>

                  </div>

                  <input type="radio" name="my_tabs_3" className="tab" aria-label="LOT 검색" />
                  <div className="tab-content bg-base-100 border-base-300 p-6">Tab content 2
                    <div className="self-stretch h-80 border border-info" />
                  </div>

                  <input type="radio" name="my_tabs_3" className="tab" aria-label="패턴 검색" />
                  <div className="tab-content bg-base-100 border-base-300 p-6">
                    <div className="flex flex-col items-center gap-2.5">


                      <div className="justify-start text-lg font-bold ">패턴 선택</div>

                      <select className="select select-info">
                        <option>동그라미</option>
                        <option>사선</option>
                      </select>
                      <div className="w-48 h-48 bg-zinc-300 rounded-full" />
                      <div className="justify-start text-lg font-bold ">좌표</div>

                      <div className="self-stretch h-52 border border-info" />
                    </div>

                  </div>
                  <div className="w-full flex flex-col p-6 gap-2.5">
                    <div className="justify-start text-lg font-bold ">제품</div>
                    <select className="select select-info">
                      <option>V1</option>
                      <option>V2</option>
                      <option>V3</option>
                    </select>
                    <div className="justify-start text-lg font-bold ">스텝</div>
                    <select className="select select-info">
                      <option>H</option>
                      <option>C</option>
                      <option>L</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className={`overflow-hidden flex flex-col justify-start items-center gap-2.5 outline-1 p-[5px] ${showDataGrid ? 'min-w-[300px] w-96 opacity-100' : 'max-w-0 w-0 opacity-0 pointer-events-none'}`}>
              {/* ... DataGrid content ... */}
              <button
                className="flex items-center gap-2 w-full justify-center py-2 text-lg font-bold text-center select-none hover:bg-gray-100 rounded transition"
                onClick={() => setShowDataGrid((prev) => !prev)}
              >
                조회 내용
                {showDataGrid ? <IoChevronBack size={22} /> : <IoChevronForward size={22} />}
              </button>
              <div className={`w-full ${showDataGrid ? '' : 'hidden'}`}>
                {searchResults.length > 0 && (
                  <div className="text-sm text-gray-600 mb-2">
                    총 {searchResults.length}개 항목 • 선택됨: {selectedGridItems.size}개
                  </div>
                )}
                <DataGrid />
              </div>
            </div>
            {!showDataGrid && (
              <button className="fixed left-2 top-1/2 z-50 bg-white border border-gray-300 rounded-full shadow p-2 flex items-center justify-center hover:bg-gray-100 transition"
                style={{ transform: 'translateY(-50%)' }}
                onClick={() => setShowDataGrid(true)}
                aria-label="조회 내용 열기" > <IoChevronForward size={24} /> </button>
            )}
            <div className="flex-1 flex flex-col outline-1">
              <div className="flex justify-center items-end gap-2.5">
                {/* ... ImageGrid controls ... */}
                <div className="w-48 flex flex-col p-2">
                  <div className="text-lg font-bold ">아이템</div>
                  <select className="select select-info">
                    <option>BIN</option>
                    <option>MSR</option>
                    <option>...</option>
                  </select>
                </div>
                <div className="w-48 flex flex-col p-2">
                  <div className="text-lg font-bold ">하위 아이템</div>
                  <select className="select select-info">
                    <option>000</option>
                    <option>001</option>
                    <option>002</option>
                  </select>
                </div>
                <div className="w-48 flex flex-col p-2">
                  <div className="text-lg font-bold ">통계</div>
                  <select className="select select-info">
                    <option>MIN</option>
                    <option>MAX</option>
                    <option>MEAN</option>
                  </select>
                </div>                <div className="w-48 flex flex-col p-2">
                  <div className="w-48">
                    <button className="btn btn-outline btn-info" onClick={handleDraw}>그리기</button>
                  </div>
                </div>
              </div>
              <ImageGrid
                totalCount={filteredTotalCount}
                images={filteredImages}
                cacheVersion={cacheVersion}
              />

              <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee' }}>
                <h2 style={{ marginBottom: '10px', fontSize: '1.5em' }}>Heatmap Component</h2>
                <div style={{ marginBottom: '10px', padding: '10px', background: '#f0f0f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                  <strong>Brush Mode:</strong>
                  <button onClick={() => setBrushOperatingMode('toggle')} style={{ padding: '5px 10px', background: brushOperatingMode === 'toggle' ? 'lightblue' : 'white', border: '1px solid #ccc' }}>
                    Toggle
                  </button>
                  <button onClick={() => setBrushOperatingMode('selectRect')} style={{ padding: '5px 10px', background: brushOperatingMode === 'selectRect' ? 'lightblue' : 'white', border: '1px solid #ccc' }}>
                    Select Area
                  </button>
                  <button onClick={() => setBrushOperatingMode('deselectRect')} style={{ padding: '5px 10px', background: brushOperatingMode === 'deselectRect' ? 'lightblue' : 'white', border: '1px solid #ccc' }}>
                    Deselect Area
                  </button>
                  <button onClick={handleHeatmapClear} style={{ padding: '5px 10px', background: 'lightcoral', color: 'white', border: '1px solid #ccc' }}>
                    Clear All (Heatmap)
                  </button>
                  <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>Current: {brushOperatingMode}</span>
                </div>
                <Heatmap
                  ref={heatmapRef}
                  data={sampleHeatmapData}
                  xAxisLabels={sampleXAxisLabels}
                  yAxisLabels={sampleYAxisLabels}
                  brushOperatingMode={brushOperatingMode}
                />
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </main>
  );
}

export default App;
