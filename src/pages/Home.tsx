import { Suspense, useCallback, useState } from "react";
import { fetchImageMetadata } from '../api/imageGenerator';
import ImageGrid from "../components/ImageGrid";
import DataGrid from "../components/DataGrid";
import SearchTabs from "../components/SearchTabs";
import { useImageDataStore } from '../store/useImageDataStore';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

function Home() {
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
    return (
        <Suspense fallback={<div className="loading loading-spinner loading-lg flex justify-center items-center min-h-screen">Loading...</div>}>
            <div className="w-full min-h-screen bg-base-100 flex flex-col">
                <div className="flex flex-1 p-4 gap-4">
                    <SearchTabs onSearch={fetchData} />

                    <div className={`transition-all duration-300 overflow-hidden flex flex-col gap-4 ${showDataGrid ? 'max-w-md w-96 opacity-100' : 'max-w-0 w-0 opacity-0 pointer-events-none'}`}>
                        <div className="card bg-base-200 h-full shadow-sm">
                            <div className="card-body p-4 flex flex-col gap-1">
                                <button
                                    className="btn btn-ghost btn-sm flex items-center gap-2 justify-between"
                                    onClick={() => setShowDataGrid((prev) => !prev)}
                                >
                                    <span className="font-medium">조회 내용</span>
                                    {showDataGrid ? <IoChevronBack size={18} /> : <IoChevronForward size={18} />}
                                </button>

                                <div className="text-sm text-base-content/70 mb-3">
                                    총 {searchResults.length}개 항목 • 선택됨: {selectedGridItems.size}개
                                </div>

                                <div className={`${showDataGrid ? 'flex-1' : 'hidden'}`}>

                                    <DataGrid />
                                </div>
                            </div>
                        </div>
                    </div>

                    {!showDataGrid && (
                        <button
                            className="fixed left-4 top-1/2 z-50 btn btn-circle btn-sm btn-primary shadow-lg"
                            style={{ transform: 'translateY(-50%)' }}
                            onClick={() => setShowDataGrid(true)}
                            aria-label="조회 내용 열기"
                        >
                            <IoChevronForward size={18} />
                        </button>
                    )}                    <div className="flex-1 flex flex-col">
                        <div className="card bg-base-200 shadow-sm mb-4">
                            <div className="card-body p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">아이템</span>
                                        </label>
                                        <select className="select select-bordered select-primary">
                                            <option>BIN</option>
                                            <option>MSR</option>
                                            <option>...</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">하위 아이템</span>
                                        </label>
                                        <select className="select select-bordered select-primary">
                                            <option>000</option>
                                            <option>001</option>
                                            <option>002</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">통계</span>
                                        </label>
                                        <select className="select select-bordered select-primary">
                                            <option>MIN</option>
                                            <option>MAX</option>
                                            <option>MEAN</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text opacity-0">액션</span>
                                        </label>
                                        <button className="btn btn-primary" onClick={handleDraw}>그리기</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 bg-base-100">
                            <ImageGrid
                                totalCount={filteredTotalCount}
                                images={filteredImages}
                                cacheVersion={cacheVersion}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Suspense>
    );
}

export default Home;
