import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ImageData, ImageGridProps } from '../types/image';
import SkeletonCard from './SkeletonCard';

interface VirtualItem {
    index: number;
    start: number;
    end: number;
    size: number;
}

const ImageGrid: React.FC<ImageGridProps> = ({
    totalCount: propTotalCount,
    images: propImages,
    apiEndpoint = '/api/images',
    cacheVersion = 0
}) => {
    const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
    const [columns, setColumns] = useState(3); // 사용자가 선택할 수 있는 컬럼 수
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set()); // 선택된 이미지들

    // Props에서 받은 데이터를 사용
    const totalCount = propTotalCount;
    const images = propImages;

    // Virtual scrolling states
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<number | null>(null);

    // 상태를 ref로 관리하여 최신 값 참조 (의존성 문제 해결)
    const imageCacheRef = useRef<Map<string, string>>(new Map());
    const loadingImagesRef = useRef<Set<string>>(new Set());

    // Virtual scrolling configuration
    const COLUMNS = columns;
    const ITEM_HEIGHT = 300; // 각 행의 높이
    const GAP = 16; // gap-4 = 1rem = 16px
    const PADDING = 16; // p-4 = 1rem = 16px
    const OVERSCAN = 2; // 화면 밖에 미리 렌더링할 행 수

    console.log('API Endpoint:', apiEndpoint);

    // 상태 업데이트 시 ref도 동기화
    useEffect(() => {
        imageCacheRef.current = imageCache;
    }, [imageCache]); useEffect(() => {
        loadingImagesRef.current = loadingImages;
    }, [loadingImages]);

    // cacheVersion이 변경될 때 캐시 초기화
    useEffect(() => {
        if (cacheVersion > 0) {
            console.log('Cache refreshed due to version change:', cacheVersion);
            setImageCache(new Map());
            setLoadingImages(new Set());
            imageCacheRef.current = new Map();
            loadingImagesRef.current = new Set();
        }
    }, [cacheVersion]);

    const fetchImageUrl = useCallback(async (imageId: string): Promise<string> => {
        // 캐시에서 먼저 확인
        if (imageCacheRef.current.has(imageId)) {
            return imageCacheRef.current.get(imageId)!;
        }

        // 이미 로딩 중인 이미지는 스킵
        if (loadingImagesRef.current.has(imageId)) {
            return '';
        }

        try {
            // 로딩 시작 표시
            setLoadingImages(prev => new Set(prev).add(imageId));

            // 시뮬레이션 대기
            await new Promise(r => setTimeout(r, 300));
            const url = `https://picsum.photos/300/300?random=${imageId}`;

            // 캐시에 저장
            setImageCache(prev => new Map(prev).set(imageId, url));
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageId);
                return newSet;
            });

            return url;
        } catch (error) {
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageId);
                return newSet;
            });
            throw error;
        }
    }, []);

    // Virtual scrolling 계산
    const virtualItems = useMemo(() => {
        const totalRows = Math.ceil(totalCount / COLUMNS);
        const startIndex = Math.max(0, Math.floor(scrollTop / (ITEM_HEIGHT + GAP)) - OVERSCAN);
        const endIndex = Math.min(
            totalRows - 1,
            Math.ceil((scrollTop + containerHeight) / (ITEM_HEIGHT + GAP)) + OVERSCAN
        );

        const items: VirtualItem[] = [];
        for (let i = startIndex; i <= endIndex; i++) {
            items.push({
                index: i,
                start: i * (ITEM_HEIGHT + GAP),
                end: i * (ITEM_HEIGHT + GAP) + ITEM_HEIGHT,
                size: ITEM_HEIGHT
            });
        }

        return items;
    }, [totalCount, scrollTop, containerHeight, COLUMNS]);

    // 현재 보이는 이미지들 계산
    const visibleImageIds = useMemo(() => {
        const ids: string[] = [];
        virtualItems.forEach(row => {
            for (let col = 0; col < COLUMNS; col++) {
                const imageIndex = row.index * COLUMNS + col;
                if (imageIndex < totalCount) {
                    ids.push(`image-${imageIndex + 1}`);
                }
            }
        });
        return ids;
    }, [virtualItems, COLUMNS, totalCount]);    // 보이는 이미지들 로드
    const loadVisibleImages = useCallback(async () => {
        const imagesToLoad = visibleImageIds.filter(id =>
            !imageCacheRef.current.has(id) && !loadingImagesRef.current.has(id)
        );

        if (imagesToLoad.length === 0) return;

        console.log(`Loading ${imagesToLoad.length} images...`);

        const loadPromises = imagesToLoad.slice(0, 20).map(async (imageId) => {
            try {
                const url = await fetchImageUrl(imageId);
                if (url) {
                    // props로 받은 images는 읽기 전용이므로 캐시만 업데이트
                    console.log(`Image ${imageId} loaded successfully`);
                }
            } catch (error) {
                console.error(`Failed to load image ${imageId}:`, error);
            }
        });

        await Promise.all(loadPromises);
    }, [visibleImageIds, fetchImageUrl]);

    // 컬럼 수 변경 핸들러
    const handleColumnsChange = useCallback((newColumns: number) => {
        setColumns(newColumns);
        setScrollTop(0); // 스크롤을 맨 위로 리셋
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
        // 새로운 레이아웃에 맞게 이미지 다시 로드
        setTimeout(() => {
            loadVisibleImages();
        }, 100);
    }, [loadVisibleImages]);

    // 이미지 선택 토글 함수
    const toggleImageSelection = useCallback((imageId: string) => {
        setSelectedImages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    }, []);

    // 선택 초기화 함수
    const clearSelection = useCallback(() => {
        setSelectedImages(new Set());
    }, []);

    // visibleImageIds가 변경될 때마다 이미지 로드
    useEffect(() => {
        if (visibleImageIds.length > 0) {
            loadVisibleImages();
        }
    }, [visibleImageIds, loadVisibleImages]);

    // 스크롤 핸들러
    const handleScroll = useCallback((e: Event) => {
        const target = e.target as HTMLDivElement;
        setScrollTop(target.scrollTop);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            console.log('Scroll stopped, loading visible images...');
            loadVisibleImages();
        }, 500);
    }, [loadVisibleImages]);

    // 컨테이너 크기 관찰
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                setContainerHeight(entry.contentRect.height);
            }
        });

        resizeObserver.observe(container);
        setContainerHeight(container.clientHeight);

        return () => resizeObserver.disconnect();
    }, []);    // 초기 로드 및 스크롤 이벤트 등록
    useEffect(() => {
        const container = containerRef.current;
        if (!container || totalCount === 0) return;

        container.addEventListener('scroll', handleScroll);

        // 초기 로드
        const timer = setTimeout(() => {
            console.log('Initial load of visible images...');
            loadVisibleImages();
        }, 100);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [totalCount, handleScroll, loadVisibleImages]); if (totalCount === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">이미지 데이터를 기다리는 중...</p>
                </div>
            </div>
        );
    }

    const totalHeight = Math.ceil(totalCount / COLUMNS) * (ITEM_HEIGHT + GAP) + PADDING * 2;

    return (
        <div className="w-full h-full">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">                    <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">이미지 갤러리 (Virtual Scroll)</h2>
                    <p className="text-gray-600">총 {totalCount}개의 이미지 • Virtual Scrolling으로 성능 최적화</p>
                    <p className="text-sm text-gray-500 mt-1">
                        캐시된 이미지: {imageCache.size} / 로딩 중: {loadingImages.size} / 렌더링된 행: {virtualItems.length}
                    </p>
                    <p className="text-sm text-blue-600 mt-1 font-medium">
                        선택된 이미지: {selectedImages.size}개
                    </p>
                </div>                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            {selectedImages.size > 0 && (
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                >
                                    선택 해제 ({selectedImages.size})
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <label htmlFor="columns-select" className="text-sm font-medium text-gray-700">
                                컬럼 수
                            </label>
                            <select
                                id="columns-select"
                                value={columns}
                                onChange={(e) => handleColumnsChange(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>
                                        {num}개
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                className="w-full h-[80vh] overflow-y-auto scroll-smooth border border-gray-300 rounded-lg"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #F7FAFC'
                }}
            >
                <div
                    style={{
                        height: totalHeight,
                        position: 'relative'
                    }}
                >
                    {virtualItems.map(row => {
                        const rowImages: ImageData[] = [];
                        for (let col = 0; col < COLUMNS; col++) {
                            const imageIndex = row.index * COLUMNS + col;
                            if (imageIndex < totalCount) {
                                rowImages.push(images[imageIndex]);
                            }
                        }

                        return (
                            <div
                                key={row.index}
                                style={{
                                    position: 'absolute',
                                    top: row.start + PADDING,
                                    left: PADDING,
                                    right: PADDING,
                                    height: ITEM_HEIGHT,
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                    gap: '1rem'
                                }}                            >                                {rowImages.map((imageData) => (
                                    <SkeletonCard
                                        key={imageData.id}
                                        imageData={imageData}
                                        isLoading={loadingImages.has(imageData.id)}
                                        cachedUrl={imageCache.get(imageData.id)}
                                        isSelected={selectedImages.has(imageData.id)}
                                        onToggleSelection={() => toggleImageSelection(imageData.id)}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ImageGrid;
