import { Suspense, useCallback, useEffect } from "react";
import "./App.css";
import { fetchImageMetadata } from './api/imageGenerator';
import ImageGrid from "./components/ImageGrid";
import DataGrid from "./components/DataGrid";
import { useImageDataStore } from './store/useImageDataStore';



function App() {
  const {
    totalCount,
    images,
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

  // // 컴포넌트 마운트 시 초기 데이터 로드
  // useEffect(() => {
  //   fetchData();
  // }, [fetchData]);


  return (
    <main className="w-full max-w-none">

      <Suspense fallback={<div>Loading...</div>}>
        <div className="w-full h-[900px] flex-col justify-center items-center gap-2.5">
          <div className="h-10 relative" />
          <div className="flex flex-1 p-2.5 justify-start items-start gap-2.5">
            <div className="w-72 inline-flex flex-col justify-start items-center gap-2.5">
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
            <div className="w-96 p-[5px] outline-1 flex flex-col justify-start items-center gap-2.5 overflow-hidden">
              <div className="text-center justify-start text-lg font-bold ">조회 내용</div>
              {searchResults.length > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  총 {searchResults.length}개 항목 • 선택됨: {selectedGridItems.size}개
                </div>
              )}
              <DataGrid />
            </div>
            <div className="flex-1 flex flex-col outline-1">
              <div className="flex justify-center items-end gap-2.5">
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
            </div>
          </div>
        </div>
      </Suspense>

    </main>
  );
}

export default App;
