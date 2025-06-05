import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { calculateImageSimilarities, getSimilarityCacheStatus } from '../api/similarityApi';
import type { SimilarityResult } from '../api/similarityApi';
import { fetchPointData } from '../api/imageGenerator';
import { generateImageDataUrlFromPoints } from '../utils/imageUtils';

interface SimilarityTableProps {
    selectedImageIds: string[];
    onImageSelect?: (imageId: string) => void;
}

const SimilarityTable: React.FC<SimilarityTableProps> = ({
    selectedImageIds,
    onImageSelect
}) => {
    const [similarities, setSimilarities] = useState<SimilarityResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cacheStatus, setCacheStatus] = useState<{ count: number; image_ids: string[] } | null>(null);

    // 이미지 캐시 관리
    const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

    // Virtual scrolling
    const containerRef = useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 100;

    const virtualizer = useVirtualizer({
        count: similarities.length,
        getScrollElement: () => containerRef.current,
        estimateSize: () => ITEM_HEIGHT,
        overscan: 5,
    });

    // 이미지 URL 가져오기
    const fetchImageUrl = useCallback(async (imageId: string): Promise<string> => {
        if (imageCache.has(imageId)) {
            return imageCache.get(imageId)!;
        }
        if (loadingImages.has(imageId)) {
            return '';
        }

        try {
            setLoadingImages(prev => new Set(prev).add(imageId));
            const points = await fetchPointData(imageId);
            const url = await generateImageDataUrlFromPoints(points);

            setImageCache(prev => new Map(prev).set(imageId, url));
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageId);
                return newSet;
            });
            return url;
        } catch (error) {
            console.error(`Failed to load image ${imageId}:`, error);
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageId);
                return newSet;
            });
            return '';
        }
    }, [imageCache, loadingImages]);    // 가시영역의 이미지들 로드
    const loadVisibleImages = useCallback(async () => {
        const visibleItems = virtualizer.getVirtualItems();
        const visibleImageIds = visibleItems
            .map(item => similarities[item.index]?.image_id)
            .filter(Boolean);

        const imagesToLoad = visibleImageIds.filter(id =>
            !imageCache.has(id) && !loadingImages.has(id)
        );

        if (imagesToLoad.length === 0) return;

        const loadPromises = imagesToLoad.slice(0, 5).map(async (imageId) => {
            try {
                await fetchImageUrl(imageId);
            } catch (error) {
                console.error(`Failed to load image ${imageId}:`, error);
            }
        });
        await Promise.all(loadPromises);
    }, [virtualizer, similarities, imageCache, loadingImages, fetchImageUrl]); useEffect(() => {
        if (similarities.length > 0) {
            loadVisibleImages();
        }
    }, [similarities, loadVisibleImages]);    // 스크롤 이벤트 처리로 가시 영역 변경 감지
    useEffect(() => {
        const container = containerRef.current;
        if (!container || similarities.length === 0) return;

        const handleScroll = () => {
            const visibleItems = virtualizer.getVirtualItems();
            const visibleImageIds = visibleItems
                .map(item => similarities[item.index]?.image_id)
                .filter(Boolean);

            const imagesToLoad = visibleImageIds.filter(id =>
                !imageCache.has(id) && !loadingImages.has(id)
            );

            if (imagesToLoad.length === 0) return;

            imagesToLoad.slice(0, 5).forEach(async (imageId) => {
                try {
                    await fetchImageUrl(imageId);
                } catch (error) {
                    console.error(`Failed to load image ${imageId}:`, error);
                }
            });
        };

        // ResizeObserver로 컨테이너 크기 변경 감지
        const resizeObserver = new ResizeObserver(() => {
            handleScroll();
        });

        container.addEventListener('scroll', handleScroll, { passive: true });
        resizeObserver.observe(container);

        // 초기 로드
        handleScroll();

        return () => {
            container.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
        };
    }, [similarities, virtualizer, imageCache, loadingImages, fetchImageUrl]);

    useEffect(() => {
        loadCacheStatus();
    }, []);

    useEffect(() => {
        if (selectedImageIds.length > 0) {
            calculateSimilarities();
        } else {
            setSimilarities([]);
        }
    }, [selectedImageIds]);

    const loadCacheStatus = async () => {
        try {
            const status = await getSimilarityCacheStatus();
            setCacheStatus(status);
        } catch (error) {
            console.error('Failed to load cache status:', error);
        }
    };

    const calculateSimilarities = async () => {
        if (selectedImageIds.length === 0) return;
        setIsLoading(true);
        setError(null);
        try {
            const results = await calculateImageSimilarities(selectedImageIds);
            setSimilarities(results);
        } catch (error) {
            setError(error instanceof Error ? error.message : '유사도 계산 중 오류가 발생했습니다.');
            console.error('Failed to calculate similarities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatSimilarity = (similarity: number) => {
        return (similarity * 100).toFixed(2) + '%';
    };

    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 0.8) return 'text-green-600 font-bold';
        if (similarity >= 0.6) return 'text-blue-600 font-semibold';
        if (similarity >= 0.4) return 'text-yellow-600';
        if (similarity >= 0.2) return 'text-orange-600';
        return 'text-red-600';
    }; if (selectedImageIds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-base-100 rounded-xl shadow-md p-8">
                <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">유사도 분석</h3>
                    <p className="text-gray-500 text-center mb-2">이미지를 선택하면 유사한 이미지들을 보여드립니다.</p>
                    {cacheStatus && (
                        <div className="mt-2 text-sm text-gray-400">
                            캐시된 이미지: <span className="font-semibold text-blue-600">{cacheStatus.count}</span>개
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-base-100 rounded-lg shadow p-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">유사도 분석 결과</h3>
                    <p className="text-sm text-gray-500">
                        선택된 <span className="font-semibold text-blue-600">{selectedImageIds.length}</span>개 이미지와 유사한 이미지들
                    </p>
                    {cacheStatus && (
                        <div className="mt-2 text-xs text-gray-400">
                            캐시: <span className="font-semibold text-blue-600">{cacheStatus.count}</span>개 |
                            분석: <span className="font-semibold text-green-600">{similarities.length}</span>개 |
                            로딩: <span className="font-semibold text-orange-600">{loadingImages.size}</span>개
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-error flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="mb-4">
                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                    </div>
                    <p className="text-gray-500">유사도를 계산하고 있습니다...</p>
                </div>
            )}{/* Results Table with Virtual Scrolling */}
            {!isLoading && similarities.length > 0 && (
                <div className="rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    {/* Table Header */}
                    <div className="bg-base-200 grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="col-span-1">순위</div>
                        <div className="col-span-3">이미지 ID</div>
                        <div className="col-span-2">유사도</div>
                        <div className="col-span-6">이미지</div>
                    </div>

                    {/* Virtual Scrolled Table Body */}
                    <div
                        ref={containerRef}
                        className="h-[700px] overflow-auto"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#CBD5E0 #F7FAFC',
                        }}
                    >
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualizer.getVirtualItems().map(virtualItem => {
                                const result = similarities[virtualItem.index];
                                const cachedUrl = imageCache.get(result.image_id);
                                const isImageLoading = loadingImages.has(result.image_id);

                                return (
                                    <div
                                        key={virtualItem.key}
                                        data-index={virtualItem.index}
                                        ref={virtualizer.measureElement}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualItem.size}px`,
                                            transform: `translateY(${virtualItem.start}px)`,
                                        }}
                                        className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-100 hover:bg-base-100 transition items-center"
                                    >
                                        {/* 순위 */}
                                        <div className="col-span-1">
                                            <span className="badge badge-outline bg-base-200">
                                                {virtualItem.index + 1}
                                            </span>
                                        </div>

                                        {/* 이미지 ID */}
                                        <div className="col-span-3 font-mono text-sm text-gray-700 truncate">
                                            {result.image_id}
                                        </div>

                                        {/* 유사도 */}
                                        <div className={`col-span-2 text-sm ${getSimilarityColor(result.similarity)}`}>
                                            {formatSimilarity(result.similarity)}
                                        </div>

                                        {/* 이미지 */}
                                        <div className="col-span-6 flex items-center gap-2">
                                            <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                                                {isImageLoading ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <div className="loading loading-spinner loading-sm"></div>
                                                    </div>
                                                ) : cachedUrl ? (
                                                    <img
                                                        src={cachedUrl}
                                                        alt={`Image ${result.image_id}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 선택 버튼 */}
                                            {onImageSelect && (
                                                <button
                                                    onClick={() => onImageSelect(result.image_id)}
                                                    className="btn btn-ghost btn-xs border border-gray-300 hover:bg-blue-50"
                                                >
                                                    선택
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}            {/* No Results */}
            {!isLoading && similarities.length === 0 && selectedImageIds.length > 0 && (
                <div className="flex flex-col items-center justify-center py-8 bg-base-100 rounded-lg shadow">
                    <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.54-.94-6.14-2.6C4.46 11.02 3.5 8.82 3.5 6.5S4.46 1.98 5.86.4C7.46-1.06 9.66-2 12-2s4.54.94 6.14 2.4c1.4 1.58 2.36 3.78 2.36 6.1s-.96 4.52-2.36 6.1z" />
                        </svg>
                    </div>
                    <p className="text-gray-500">유사한 이미지를 찾지 못했습니다.</p>
                </div>
            )}
        </>
    );
};

export default SimilarityTable;
