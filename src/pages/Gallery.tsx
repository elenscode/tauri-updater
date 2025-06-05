import { Suspense, useMemo, useState } from "react";
// import ImageGrid from "../components/ImageGrid";
import { useImageDataStore } from '../store/useImageDataStore';
import ImageGrid from "../components/ImageGrid";
import SimilarityTable from "../components/SimilarityTable";
// import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

function Gallery() {
    // 필요한 상태만 선택적으로 구독
    const filteredImages = useImageDataStore(state => state.filteredImages);
    const filteredTotalCount = useImageDataStore(state => state.filteredTotalCount);
    const cacheVersion = useImageDataStore(state => state.cacheVersion);

    // 유사도 분석 패널 상태
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [showSimilarityPanel, setShowSimilarityPanel] = useState(false);

    // ImageGrid props를 메모이제이션
    const imageGridProps = useMemo(() => ({
        totalCount: filteredTotalCount,
        images: filteredImages,
        cacheVersion: cacheVersion,
        onSimilarityAnalysis: (imageIds: string[]) => {
            setSelectedImages(imageIds);
            setShowSimilarityPanel(true);
        }
    }), [filteredTotalCount, filteredImages, cacheVersion]);

    const handleCloseSimilarityPanel = () => {
        setShowSimilarityPanel(false);
        setSelectedImages([]);
    };

    return (
        <Suspense fallback={<div className="loading loading-spinner loading-lg flex justify-center items-center min-h-screen">Loading...</div>}>
            <div className="w-full bg-base-100 flex flex-col">
                <div className="flex flex-1 p-4 gap-4">
                    {/* 메인 이미지 그리드 */}
                    <div className={`${showSimilarityPanel ? 'w-3/4' : 'w-full'} transition-all duration-300`}>
                        <ImageGrid
                            {...imageGridProps}
                        />
                    </div>

                    {/* 유사도 분석 패널 */}
                    {showSimilarityPanel && (
                        <div className="w-1/4 rounded-lg shadow-lg flex flex-col">
                            {/* 패널 헤더 */}
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={handleCloseSimilarityPanel}
                                    className="btn btn-ghost btn-sm btn-circle"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 패널 내용 */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <SimilarityTable
                                    selectedImageIds={selectedImages}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Suspense>
    );
}

export default Gallery;
