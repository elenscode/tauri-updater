import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import type { ImageData, ImageGridProps } from '../types/image';
import { generateImageDataUrlFromPoints } from '../utils/imageUtils';
import SkeletonCard from './SkeletonCard';
import { fetchPointData } from '../api/imageGenerator';
import { usePatternStore } from '../store/usePatternStore';
import { cacheImageFeatures } from '../api/similarityApi';

const ImageGrid: React.FC<ImageGridProps> = React.memo(({
    totalCount: propTotalCount,
    images: propImages,
    apiEndpoint = '/api/images',
    cacheVersion = 0
}) => {
    const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set()); const [columns, setColumns] = useState(3);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isCreatingPattern, setIsCreatingPattern] = useState(false);
    const [isSimilarityWindowOpen, setIsSimilarityWindowOpen] = useState(false);
    const similarityWindowRef = useRef<Window | null>(null);

    const navigate = useNavigate();
    const { generatePatternFromImages, threshold } = usePatternStore();

    const totalCount = propTotalCount;
    const images = propImages;

    const containerRef = useRef<HTMLDivElement>(null);

    const imageCacheRef = useRef(imageCache);
    const loadingImagesRef = useRef(loadingImages);

    const COLUMNS = columns;
    const ITEM_HEIGHT = 300;
    const GAP = 16;
    const OVERSCAN = 2;

    console.log('API Endpoint:', apiEndpoint);

    useEffect(() => {
        imageCacheRef.current = imageCache;
    }, [imageCache]);

    useEffect(() => {
        loadingImagesRef.current = loadingImages;
    }, [loadingImages]);

    useEffect(() => {
        if (cacheVersion > 0) {
            console.log('Cache refreshed due to version change:', cacheVersion);
            setImageCache(new Map());
            setLoadingImages(new Set());
            imageCacheRef.current = new Map();
            loadingImagesRef.current = new Set();
        }
    }, [cacheVersion]); const fetchImageUrl = useCallback(async (imageId: string): Promise<string> => {
        if (imageCacheRef.current.has(imageId)) {
            return imageCacheRef.current.get(imageId)!;
        }
        if (loadingImagesRef.current.has(imageId)) {
            return '';
        }
        const imageData = images.find(img => img.id === imageId);
        if (imageData && imageData.url) {
            setImageCache(prev => new Map(prev).set(imageId, imageData.url!));
            return imageData.url;
        }
        try {
            setLoadingImages(prev => new Set(prev).add(imageId));

            //await new Promise(r => setTimeout(r, 100)); // Simulate API call
            //const url = `https://picsum.photos/300/300?random=${imageId}`;
            // const url = await generateImageUrlFromApi(apiEndpoint + `?id=${imageId}`);
            const points = await fetchPointData(imageId);
            const url = await generateImageDataUrlFromPoints(points);

            // Cache features in Rust backend for similarity calculation
            try {
                const pointsArray: Array<[number, number, number]> = points.map(p => [
                    parseFloat(p.x.toString()),
                    parseFloat(p.y.toString()),
                    parseFloat(p.value)
                ]);

                await cacheImageFeatures(imageId, pointsArray);
                console.log(`Features cached for image: ${imageId}`);
            } catch (error) {
                console.warn(`Failed to cache features for image ${imageId}:`, error);
            }

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
    }, [images]);

    const actualImageCount = Math.min(totalCount, images.length);
    const rowCount = Math.ceil(actualImageCount / COLUMNS);

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => containerRef.current,
        estimateSize: () => ITEM_HEIGHT + GAP,
        overscan: OVERSCAN,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    const loadVisibleImages = useCallback(async () => {
        const visibleImageIds: string[] = [];
        virtualItems.forEach(virtualRow => {
            for (let col = 0; col < COLUMNS; col++) {
                const imageIndex = virtualRow.index * COLUMNS + col;
                if (imageIndex < actualImageCount) {
                    visibleImageIds.push(images[imageIndex].id);
                }
            }
        });

        const imagesToLoad = visibleImageIds.filter(id =>
            !imageCacheRef.current.has(id) && !loadingImagesRef.current.has(id)
        );

        if (imagesToLoad.length === 0) return;
        console.log(`Loading ${imagesToLoad.length} images...`);

        const loadPromises = imagesToLoad.slice(0, 10).map(async (imageId) => {
            try {
                const url = await fetchImageUrl(imageId);
                if (url) {
                    console.log(`Image ${imageId} loaded successfully`);
                }
            } catch (error) {
                console.error(`Failed to load image ${imageId}:`, error);
            }
        });
        await Promise.all(loadPromises);
    }, [virtualItems, COLUMNS, actualImageCount, images, fetchImageUrl]);

    useEffect(() => {
        if (virtualItems.length > 0) {
            loadVisibleImages();
        }
    }, [virtualItems, loadVisibleImages]);


    const handleColumnsChange = useCallback((newColumns: number) => {
        setColumns(newColumns);
        // When columns change, virtualizer updates automatically due to changed `rowCount`
        // We might want to scroll to top as well
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, []);

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
    }, []); const clearSelection = useCallback(() => {
        setSelectedImages(new Set());
    }, []); const handleCreatePattern = useCallback(async () => {
        if (selectedImages.size === 0) return;

        setIsCreatingPattern(true);
        try {
            const selectedImageIds = Array.from(selectedImages);
            await generatePatternFromImages(selectedImageIds, threshold);

            // 패턴 생성 완료 후 Draw 페이지로 이동
            navigate('/draw');
        } catch (error) {
            console.error('패턴 생성 중 오류 발생:', error);
            alert('패턴 생성 중 오류가 발생했습니다.');
        } finally {
            setIsCreatingPattern(false);
        }
    }, [selectedImages, threshold, generatePatternFromImages, navigate]);

    const handleAnalyzeSimilarity = useCallback(async () => {
        if (selectedImages.size === 0) return;

        setIsCreatingPattern(true);
        try {
            const selectedImageIds = Array.from(selectedImages);
            await generatePatternFromImages(selectedImageIds, threshold);

            // 패턴 생성 완료 후 브라우저 새창에서 유사도 분석 테이블 오픈
            setIsSimilarityWindowOpen(true);
        } catch (error) {
            console.error('패턴 생성 중 오류 발생:', error);
            alert('패턴 생성 중 오류가 발생했습니다.');
        } finally {
            setIsCreatingPattern(false);
        }
    }, [selectedImages, threshold, generatePatternFromImages]);


    useEffect(() => {
        if (isSimilarityWindowOpen) {
            if (!similarityWindowRef.current || similarityWindowRef.current.closed) {
                similarityWindowRef.current = window.open('', '_blank', 'width=480,height=700');
            }
            const win = similarityWindowRef.current;
            if (win) {
                win.document.title = '유사도 분석';
                win.document.body.innerHTML = '<div id="similarity-root"></div>';
                // 스타일 복사: 메인 document의 <link rel="stylesheet">와 <style>을 새 창에 복사
                const mainHead = document.head;
                const winHead = win.document.head;
                // link 복사
                mainHead.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                    const newLink = win.document.createElement('link');
                    Array.from(link.attributes).forEach(attr => {
                        newLink.setAttribute(attr.name, attr.value);
                    });
                    winHead.appendChild(newLink);
                });
                // style 복사
                mainHead.querySelectorAll('style').forEach(style => {
                    const newStyle = win.document.createElement('style');
                    newStyle.textContent = style.textContent;
                    winHead.appendChild(newStyle);
                });
                // React 18+ createRoot 지원
                import('react-dom/client').then(({ createRoot }) => {
                    import('./SimilarityTable').then(({ default: SimilarityTable }) => {
                        const rootEl = win.document.getElementById('similarity-root');
                        if (rootEl) {
                            createRoot(rootEl).render(
                                React.createElement(SimilarityTable, {
                                    selectedImageIds: Array.from(selectedImages),
                                })
                            );
                        }
                    });
                });
            }
        } else {
            if (similarityWindowRef.current && !similarityWindowRef.current.closed) {
                similarityWindowRef.current.close();
                similarityWindowRef.current = null;
            }
        }
        const interval = setInterval(() => {
            if (similarityWindowRef.current && similarityWindowRef.current.closed) {
                setIsSimilarityWindowOpen(false);
                similarityWindowRef.current = null;
            }
        }, 500);
        return () => clearInterval(interval);
    }, [isSimilarityWindowOpen, selectedImages]);

    if (totalCount === 0 || images.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600">이미지 데이터를 기다리는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <div className="p-4 shadow-sm rounded-lg">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-4 text-sm text-primary" role="alert">
                            이미지{actualImageCount} 개
                        </div>
                        <div className="p-4 text-sm text-primary" role="alert">
                            캐시 {imageCache.size}
                        </div>
                        <div className="p-4 text-sm text-primary" role="alert">
                            로딩 {loadingImages.size}
                        </div>
                        <div className="p-4 text-sm text-primary" role="alert">
                            선택 {selectedImages.size}개
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-sm btn-primary rounded-full"
                            onClick={clearSelection}
                            disabled={selectedImages.size === 0}
                        >선택 해제</button>                        <button
                            onClick={handleCreatePattern}
                            disabled={selectedImages.size === 0 || isCreatingPattern}
                            className="btn btn-sm btn-primary rounded-full"
                        >
                            {isCreatingPattern ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    패턴 생성 중...
                                </>
                            ) : (
                                '패턴 만들기'
                            )}
                        </button>

                        <button
                            onClick={handleAnalyzeSimilarity}
                            disabled={selectedImages.size === 0 || isCreatingPattern}
                            className="btn btn-sm btn-secondary rounded-full"
                        >
                            {isCreatingPattern ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    분석 중...
                                </>
                            ) : (
                                '유사도 분석'
                            )}
                        </button>

                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="columns-select" className="font-medium text-gray-700 mr-2">
                            컬럼
                        </label>
                        <select
                            id="columns-select"
                            value={columns}
                            onChange={(e) => handleColumnsChange(Number(e.target.value))}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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

            <div
                ref={containerRef}
                className="w-full h-[80vh] overflow-y-auto scroll-smooth border border-gray-300 rounded-lg p-4" // Added PADDING here
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #F7FAFC',
                }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualItems.map(virtualRow => {
                        const rowImages: ImageData[] = [];
                        for (let col = 0; col < COLUMNS; col++) {
                            const imageIndex = virtualRow.index * COLUMNS + col;
                            if (imageIndex < actualImageCount) {
                                rowImages.push(images[imageIndex]);
                            }
                        }

                        if (rowImages.length === 0) {
                            return null;
                        }

                        return (
                            <div
                                key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={rowVirtualizer.measureElement}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
                                    gap: `${GAP}px`,
                                    paddingBottom: `${GAP}px`, // Ensure gap below the row
                                }}
                            >
                                {rowImages.map((imageData) => (
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
                    })}                </div>
            </div>

        </div>
    );
});

export default ImageGrid;
