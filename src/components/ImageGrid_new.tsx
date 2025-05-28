import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ImageData {
    id: string;
    name: string;
    url?: string;
}

interface ImageGridProps {
    apiEndpoint?: string;
}

const ImageGrid: React.FC<ImageGridProps> = ({ apiEndpoint = '/api/images' }) => {
    const [images, setImages] = useState<ImageData[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [visibleImageIds, setVisibleImageIds] = useState<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<number | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    console.log('API Endpoint:', apiEndpoint); // API endpoint 사용

    // Mock API 함수들 (실제 환경에서는 실제 API로 교체)
    const fetchImageMetadata = async (): Promise<{ count: number; images: ImageData[] }> => {
        // 실제 API 호출 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock 데이터 생성
        const count = 1000; // 예시: 총 1000개의 이미지
        const imageList: ImageData[] = Array.from({ length: count }, (_, index) => ({
            id: `image-${index + 1}`,
            name: `Image ${index + 1}.jpg`
        }));

        return { count, images: imageList };
    };

    const fetchImageUrl = useCallback(async (imageId: string): Promise<string> => {
        // 실제 이미지 URL 가져오기 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 300));

        // Mock 이미지 URL (실제로는 서버에서 이미지를 가져와야 함)
        return `https://picsum.photos/300/200?random=${imageId}`;
    }, []);

    // 보이는 영역의 이미지들 로드
    const loadVisibleImages = useCallback(async () => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const visibleElements = container.querySelectorAll('.image-placeholder:not(.loaded)');
        const loadPromises: Promise<void>[] = [];

        visibleElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // 요소가 컨테이너 내에서 보이는지 확인
            const isVisible = rect.top < containerRect.bottom && rect.bottom > containerRect.top;

            if (isVisible) {
                const imageId = element.getAttribute('data-image-id');
                if (imageId && !visibleImageIds.has(imageId)) {
                    setVisibleImageIds(prev => new Set(prev).add(imageId));

                    const loadPromise = fetchImageUrl(imageId).then(url => {
                        setImages(prevImages =>
                            prevImages.map(img =>
                                img.id === imageId ? { ...img, url } : img
                            )
                        );
                    }).catch(error => {
                        console.error(`Failed to load image ${imageId}:`, error);
                    });

                    loadPromises.push(loadPromise);
                }
            }
        });

        if (loadPromises.length > 0) {
            console.log(`Loading ${loadPromises.length} images...`);
            await Promise.all(loadPromises);
        }
    }, [visibleImageIds, fetchImageUrl]);

    // 스크롤 디바운스 처리
    const handleScroll = useCallback(() => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            console.log('Scroll stopped, loading visible images...');
            loadVisibleImages();
        }, 2000); // 2초 후 실행
    }, [loadVisibleImages]);

    // 초기 메타데이터 로드
    useEffect(() => {
        const loadImageMetadata = async () => {
            try {
                setLoading(true);
                const { count, images: imageList } = await fetchImageMetadata();
                setTotalCount(count);
                setImages(imageList);
            } catch (error) {
                console.error('Failed to load image metadata:', error);
            } finally {
                setLoading(false);
            }
        };

        loadImageMetadata();
    }, []);

    // 이미지 로드 완료 후 초기 보이는 영역 로드
    useEffect(() => {
        if (!loading && images.length > 0) {
            // 컴포넌트가 렌더링 된 후 초기 로드
            const timer = setTimeout(() => {
                console.log('Initial load of visible images...');
                loadVisibleImages();
            }, 500); // 조금 더 여유를 두고 실행

            return () => clearTimeout(timer);
        }
    }, [loading, images.length, loadVisibleImages]);

    // 스크롤 이벤트 리스너 등록
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => {
                container.removeEventListener('scroll', handleScroll);
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
            };
        }
    }, [handleScroll]);

    // Intersection Observer 설정
    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const imageId = entry.target.getAttribute('data-image-id');
                        if (imageId) {
                            entry.target.classList.add('visible');
                        }
                    }
                });
            },
            { threshold: 0.1 }
        );

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // 스켈레톤 UI 컴포넌트
    const SkeletonCard = ({ imageData }: { imageData: ImageData }) => {
        const cardRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (cardRef.current && observerRef.current) {
                observerRef.current.observe(cardRef.current);
            }
        }, []);

        const hasUrl = Boolean(imageData.url);

        return (
            <div
                ref={cardRef}
                className={`image-placeholder ${hasUrl ? 'loaded' : ''} relative bg-gray-200 rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg`}
                data-image-id={imageData.id}
                style={{ aspectRatio: '3/2' }}
            >
                {hasUrl ? (
                    <div className="w-full h-full">
                        <img
                            src={imageData.url}
                            alt={imageData.name}
                            className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
                            loading="lazy"
                            onLoad={(e) => {
                                e.currentTarget.classList.add('opacity-100');
                                e.currentTarget.classList.remove('opacity-0');
                            }}
                            onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Error';
                                e.currentTarget.classList.add('opacity-100');
                                e.currentTarget.classList.remove('opacity-0');
                            }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-white text-sm font-medium truncate">{imageData.name}</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col justify-end p-3">
                        {/* 스켈레톤 애니메이션 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
                        <div className="relative z-10">
                            <div className="h-4 bg-gray-400 rounded animate-pulse mb-1"></div>
                            <div className="h-3 bg-gray-400 rounded animate-pulse w-2/3"></div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">이미지 메타데이터를 로드하는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">이미지 갤러리</h2>
                <p className="text-gray-600">총 {totalCount}개의 이미지 • 스크롤을 멈추면 2초 후 이미지가 로드됩니다</p>
                <p className="text-sm text-gray-500 mt-1">
                    로드된 이미지: {images.filter(img => img.url).length} / {totalCount}
                </p>
            </div>

            <div
                ref={containerRef}
                className="w-full h-[80vh] overflow-y-auto scroll-smooth border border-gray-300 rounded-lg"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #F7FAFC'
                }}
            >
                <div className="grid grid-cols-6 gap-4 p-4">
                    {images.map((imageData) => (
                        <SkeletonCard key={imageData.id} imageData={imageData} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ImageGrid;
