// ImageGrid 컴포넌트 관련 상수들
export const IMAGE_GRID_CONFIG = {
  // 그리드 레이아웃
  DEFAULT_COLUMNS: 3,
  ITEM_HEIGHT: 300,
  GAP: 16,
  OVERSCAN: 2,
  COLUMN_OPTIONS: [1, 2, 3, 4, 5, 6],
  
  // BIN 관련
  BIN_COUNT: 699,
  BIN_LABEL_PADDING: 3, // BIN 번호 패딩 (001, 002 등)
  
  // TanStack Query 캐시 설정
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5분
  QUERY_GC_TIME: 10 * 60 * 1000, // 10분
  
  // 가상화 관련
  VIRTUAL_REMEASURE_DELAY: 100, // 가상화 재측정 지연시간 (ms)
};

// UI 클래스명 상수들
export const IMAGE_GRID_STYLES = {
  // 컨테이너
  MAIN_CONTAINER: 'w-full h-full',
  HEADER_CONTAINER: 'mb-4 p-4 shadow-sm rounded-lg',
  HEADER_FLEX: 'flex flex-wrap justify-between items-start gap-4 mb-2',
  SCROLL_CONTAINER: 'w-full h-[80vh] overflow-y-auto scroll-smooth border border-gray-300 rounded-lg p-4',
  
  // 상태 표시 영역
  STATUS_CONTAINER: 'min-h-[40px] px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex items-center gap-1',
  STATUS_BADGE: 'text-xs font-medium rounded-md px-2 py-1',
  
  // 버튼
  BUTTON_CONTAINER: 'min-h-[40px] px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex items-center gap-1',
  COLUMN_SELECT_CONTAINER: 'flex items-center gap-2',
  COLUMN_SELECT_LABEL: 'font-medium text-gray-700 mr-2',
  COLUMN_SELECT: 'px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition',
  
  // 로딩
  LOADING_CONTAINER: 'flex items-center justify-center h-64',
  LOADING_CONTENT: 'text-center',
  LOADING_SPINNER: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4',
  LOADING_TEXT: 'text-gray-600',
  
  // 그리드
  GRID_CONTAINER: 'position: relative',
};

// 상태 뱃지 스타일
export const STATUS_BADGE_STYLES = {
  IMAGE_COUNT: 'bg-blue-100 text-primary',
  CACHE_COUNT: 'bg-blue-100 text-primary',
  LOADING_COUNT: 'bg-blue-100 text-primary',
  SELECTED_COUNT: 'bg-warning text-primary',
  BINARY_MODE: 'bg-orange-100 text-orange-800',
  NORMAL_MODE: 'bg-gray-100 text-gray-800',
};

// 버튼 클래스
export const BUTTON_STYLES = {
  CACHE_CLEAR: 'btn btn-xs btn-ghost',
  SELECTION_CLEAR: 'btn btn-xs btn-warning',
  MODE_TOGGLE: 'btn btn-xs btn-info',
  BINARIZE: 'btn btn-xs btn-primary',
  CREATE_PATTERN: 'btn btn-xs btn-primary',
  ANALYZE_SIMILARITY: 'btn btn-xs btn-secondary',
};

// 메시지 상수
export const IMAGE_GRID_MESSAGES = {
  LOADING: '이미지 데이터를 기다리는 중...',
  PATTERN_ERROR: '패턴 생성 중 오류가 발생했습니다.',
  BINARIZE_ERROR: '이진화 처리 중 오류가 발생했습니다.',
  
  // 콘솔 로그 메시지
  PATTERN_CREATE_BINARY: '이진화 모드로 패턴 생성:',
  PATTERN_CREATE_NORMAL: '일반 모드로 패턴 생성:',
  SIMILARITY_ANALYZE_BINARY: '이진화 모드로 유사도 분석:',
  SIMILARITY_ANALYZE_NORMAL: '일반 모드로 유사도 분석:',
  BINARIZE_START: '이진화 처리 시작 - 선택된 BIN 값들:',
};

// 라벨 텍스트
export const IMAGE_GRID_LABELS = {
  IMAGE_COUNT: '이미지',
  CACHE_COUNT: '캐시',
  LOADING_COUNT: '로딩',
  SELECTED_COUNT: '선택',
  BINARY_MODE: '이진화 모드',
  NORMAL_MODE: '일반 모드',
  COLUMN_LABEL: '컬럼',
  
  // 버튼 텍스트
  CACHE_CLEAR: '캐시 초기화',
  SELECTION_CLEAR: '선택 해제',
  MODE_TO_NORMAL: '일반 모드',
  CREATE_PATTERN: '패턴 만들기',
  ANALYZE_SIMILARITY: '유사도 분석',
  
  // 툴팁
  CACHE_CLEAR_TOOLTIP: '캐시 초기화',
  MODE_TOGGLE_TOOLTIP: '일반 모드로 전환',
  
  // 단위
  COUNT_UNIT: '개',
  
  // 플레이스홀더
  BIN_SELECT_PLACEHOLDER: 'BIN 선택',
};

// 스크롤바 스타일
export const SCROLLBAR_STYLES = {
  scrollbarWidth: 'thin' as const,
  scrollbarColor: '#CBD5E0 #F7FAFC',
};

// BIN 옵션 생성 함수
export const generateBinOptions = () =>
  Array.from({ length: IMAGE_GRID_CONFIG.BIN_COUNT }, (_, i) => i + 1).map((num) => ({
    value: num,
    label: `BIN${num.toString().padStart(IMAGE_GRID_CONFIG.BIN_LABEL_PADDING, '0')}`,
  }));

// 쿼리 키 생성 함수
export const createImageQueryKey = (
  imageId: string, 
  binaryOptions?: { selectedValues: number[]; isBinary: boolean }
) => ['image', imageId, binaryOptions];

// 그리드 계산 유틸리티
export const calculateRowCount = (imageCount: number, columns: number) => 
  Math.ceil(imageCount / columns);

export const calculateActualImageCount = (totalCount: number, imagesLength: number) => 
  Math.min(totalCount, imagesLength);
