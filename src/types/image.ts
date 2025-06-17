// 이미지 관련 타입 정의

export interface ImageData {
    id: string;
    key: string;
    name: string;
    url?: string;
    lotid?: string;
    waferid?: string;
    endtime?: string; // ISO 8601 형식의 날짜 문자열
    [key: string]: any; // 추가적인 속성을 허용
}

export interface ImageGridProps {
    totalCount: number;
    images: ImageData[];
    apiEndpoint?: string;
    cacheVersion?: number;
    onSimilarityAnalysis?: (imageIds: string[]) => void;
}

export interface PointData { x: number; y: number; value: string; }
