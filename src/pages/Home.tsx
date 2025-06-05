import { Suspense } from "react";
// import { fetchImageMetadata } from '../api/imageGenerator';
// import ImageGrid from "../components/ImageGrid";
import DataGrid from "../components/DataGrid";
import SearchTabs from "../components/SearchTabs";
import { useImageDataStore } from '../store/useImageDataStore';
// import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

function Home() {
    // 필요한 상태만 선택적으로 구독
    // const filteredImages = useImageDataStore(state => state.filteredImages);
    // const filteredTotalCount = useImageDataStore(state => state.filteredTotalCount);
    const searchResults = useImageDataStore(state => state.searchResults);
    const selectedGridItems = useImageDataStore(state => state.selectedGridItems);
    // const cacheVersion = useImageDataStore(state => state.cacheVersion);

    return (
        <Suspense fallback={<div className="loading loading-spinner loading-lg flex justify-center items-center min-h-screen">Loading...</div>}>
            <div className="w-full bg-base-100 flex flex-col">
                <div className="flex flex-1 p-4 gap-4">
                    <SearchTabs />


                    <div className="w-full">
                        <div className="p-4 flex flex-col h-full  gap-1">


                            <div className="text-sm text-base-content/70 mb-3">
                                총 {searchResults.length}개 항목 • 선택됨: {selectedGridItems.size}개
                            </div>
                            <div className="flex-1  border border-base-300 rounded-box">
                                <DataGrid />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Suspense>
    );
}

export default Home;
