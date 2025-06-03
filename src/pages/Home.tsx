import { Suspense, useCallback, useState, useMemo } from "react";
import { fetchImageMetadata } from '../api/imageGenerator';
import ImageGrid from "../components/ImageGrid";
import DataGrid from "../components/DataGrid";
import SearchTabs from "../components/SearchTabs";
import { useImageDataStore } from '../store/useImageDataStore';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

function Home() {
    // 필요한 상태만 선택적으로 구독
    const filteredImages = useImageDataStore(state => state.filteredImages);
    const filteredTotalCount = useImageDataStore(state => state.filteredTotalCount);
    const searchResults = useImageDataStore(state => state.searchResults);
    const selectedGridItems = useImageDataStore(state => state.selectedGridItems);
    const cacheVersion = useImageDataStore(state => state.cacheVersion);
    const setImageData = useImageDataStore(state => state.setImageData);

    const fetchData = useCallback(async () => {
        try {
            const { totalCount, images } = await fetchImageMetadata();
            setImageData(totalCount, images);
        } catch (error) {
            console.error("Error fetching images:", error);
        }
    }, [setImageData]);


    const [showDataGrid, setShowDataGrid] = useState(true);    // DataGrid를 메모이제이션하여 불필요한 리렌더링 방지 (searchResults와 selectedGridItems 변경 시에만 재렌더링)
    const memoizedDataGrid = useMemo(() => <DataGrid />, [searchResults.length, selectedGridItems.size]);

    // ImageGrid props를 메모이제이션
    const imageGridProps = useMemo(() => ({
        totalCount: filteredTotalCount,
        images: filteredImages,
        cacheVersion: cacheVersion
    }), [filteredTotalCount, filteredImages, cacheVersion]); return (
        <Suspense fallback={<div className="loadingrmflr loading-spinner loading-lg flex justify-center items-center min-h-screen">Loading...</div>}>
            <div className="w-full bg-base-100 flex flex-col">
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
                                </div>                                <div className={`${showDataGrid ? 'flex-1' : 'hidden'}`}>
                                    {memoizedDataGrid}
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
                    )}
                    <div className="flex-1 flex flex-col">

                        <div className="flex-1 bg-base-100">
                            <ImageGrid
                                {...imageGridProps}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Suspense>
    );
}

export default Home;
