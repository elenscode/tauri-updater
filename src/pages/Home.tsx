import { Suspense, useCallback, useMemo } from "react";
import { fetchImageMetadata } from '../api/imageGenerator';
import ImageGrid from "../components/ImageGrid";
import LeftSidebar from "../components/LeftSidebar";
import { useImageDataStore } from '../store/useImageDataStore';

function Home() {
    // 필요한 상태만 선택적으로 구독
    const filteredImages = useImageDataStore(state => state.filteredImages);
    const filteredTotalCount = useImageDataStore(state => state.filteredTotalCount);
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

    // ImageGrid props를 메모이제이션
    const imageGridProps = useMemo(() => ({
        totalCount: filteredTotalCount,
        images: filteredImages,
        cacheVersion: cacheVersion
    }), [filteredTotalCount, filteredImages, cacheVersion]); return (
        <Suspense fallback={<div className="loading-spinner loading-lg flex justify-center items-center h-full">Loading...</div>}>
            <div className="w-full bg-base-100 flex flex-col">
                <div className="flex flex-1">
                    <LeftSidebar onSearch={fetchData} />

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        <div className="flex-1 bg-base-100 overflow-auto">
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
