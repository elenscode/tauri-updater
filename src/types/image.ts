// 이미지 관련 타입 정의

export interface ImageData {
    id: string;
    key: string;
    name: string;
    url?: string;
}

export interface ImageGridProps {
    totalCount: number;
    images: ImageData[];
    apiEndpoint?: string;
    cacheVersion?: number;
}
