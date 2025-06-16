// 이미지 관련 타입 정의

export interface ImageData {
  id: string;
  key: string;
  name: string;
  url?: string;
  lotid?: string;
  waferid?: string;
  endtime?: string; // ISO 8601 형식의 날짜 문자열
  similarity?: number; // 유사도 값 (0-1 범위)
  [key: string]: any; // 추가적인 속성을 허용
}
export interface ImageSubitem {
  value: number | string;
  label: string;
}

export interface ImageGridProps {}

export interface PointData {
  x: number;
  y: number;
  value: number;
}
