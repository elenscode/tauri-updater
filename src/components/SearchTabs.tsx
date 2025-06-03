import React, { useState, useRef, useCallback } from 'react';
import { useProductStore } from '../store/useProductStore';
import { useSearchAction } from '../hooks/useSearchAction';
import { useImageDataStore } from '../store/useImageDataStore';

interface SearchTabsProps {
    onSearch?: (searchData: SearchFormData) => void;
}

export interface SearchFormData {
    product: string;
    step: string;
    startDate: string;
    endDate: string;
    part: string;
    searchType: 'general' | 'lot';
    lotNumbers?: string[];
}

// 검색 액션 함수
const performSearch = async (searchData: SearchFormData): Promise<SearchFormData> => {
    // 검색 로직 시뮬레이션 (실제로는 API 호출 등)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 여기서 실제 검색 API를 호출하거나 데이터 처리를 수행
    console.log('검색 데이터:', searchData);

    return searchData;
};

const SearchTabs: React.FC<SearchTabsProps> = ({ onSearch }) => {
    const { product, step, startDate, endDate, setProductData } = useProductStore();
    const [part, setPart] = useState('');
    const lotInputRef = useRef<HTMLTextAreaElement>(null);
    const [searchType, setSearchType] = useState<'general' | 'lot'>('general');

    const { state: searchState, execute: executeSearch, isPending } = useSearchAction(
        performSearch,
        {}
    );

    // select, input 등 값 변경 핸들러
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setProductData(e.target.value, step, startDate, endDate);
    };
    const handleStepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setProductData(product, e.target.value, startDate, endDate);
    };
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProductData(product, step, e.target.value, endDate);
    };
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProductData(product, step, startDate, e.target.value);
    }; const handlePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPart(e.target.value);
    };    // 폼 제출 핸들러
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const lotInput = lotInputRef.current?.value || '';

        const searchData: SearchFormData = {
            product,
            step,
            startDate,
            endDate,
            part,
            searchType,
            ...(searchType === 'lot' && {
                lotNumbers: lotInput
                    .split('\n')
                    .map((lot: string) => lot.trim())
                    .filter((lot: string) => lot.length > 0)
            })
        };

        executeSearch(searchData);

        // 검색 완료 시 콜백 호출
        if (onSearch) {
            onSearch(searchData);
        }
    };
    const applyFilter = useImageDataStore(state => state.applyFilter);
    const handleDraw = useCallback(() => {
        applyFilter();
    }, [applyFilter]);

    return (
        <div className="w-full max-w-md mx-auto card bg-base-100 shadow-xl rounded-2xl border border-gray-200">
            <div className="card-body p-6">
                <div className="space-y-6">
                    {/* 제품/스텝 선택 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">제품</label>
                            <select
                                className="select select-bordered w-full text-base"
                                value={product}
                                onChange={handleProductChange}
                                name="product"
                            >
                                <option value="V1">V1</option>
                                <option value="V2">V2</option>
                                <option value="V3">V3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">스텝</label>
                            <select
                                className="select select-bordered w-full text-base"
                                value={step}
                                onChange={handleStepChange}
                                name="step"
                            >
                                <option value="H">H</option>
                                <option value="C">C</option>
                                <option value="L">L</option>
                            </select>
                        </div>
                    </div>

                    {/* 탭 */}
                    <div className="tabs tabs-border w-full">
                        <input
                            type="radio"
                            name="search_tabs"
                            className="tab"
                            aria-label="일반 검색"
                            defaultChecked={searchType === 'general'}
                            onChange={() => setSearchType('general')}
                        />
                        <div className="tab-content bg-base-100 border-base-300 rounded-box p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">시작일</label>
                                        <input
                                            type="date"
                                            className="input input-bordered w-full"
                                            value={startDate}
                                            onChange={handleStartDateChange}
                                            name="startDate"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">종료일</label>
                                        <input
                                            type="date"
                                            className="input input-bordered w-full"
                                            value={endDate}
                                            onChange={handleEndDateChange}
                                            name="endDate"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">파트 (옵션)</label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        placeholder="파트명 입력"
                                        value={part}
                                        onChange={handlePartChange}
                                        name="part"
                                    />
                                </div>
                                {searchState.error && (
                                    <div className="alert alert-error">
                                        <span>{searchState.error}</span>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className={`btn btn-primary w-full ${isPending ? 'loading' : ''}`}
                                    disabled={isPending}
                                >
                                    {isPending ? '검색 중...' : '검색'}
                                </button>
                            </form>
                        </div>

                        <input
                            type="radio"
                            name="search_tabs"
                            className="tab"
                            aria-label="LOT 검색"
                            checked={searchType === 'lot'}
                            onChange={() => setSearchType('lot')}
                        />
                        <div className="tab-content bg-base-100 border-base-300 rounded-box p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">LOT 번호</label>
                                    <textarea
                                        ref={lotInputRef}
                                        className="textarea textarea-bordered w-full h-32"
                                        placeholder="LOT001\nLOT002\nLOT003"
                                        name="lotInput"
                                    />
                                    <span className="text-xs text-gray-400 mt-1 block">각 줄에 하나의 LOT 번호를 입력하세요</span>
                                </div>
                                {searchState.error && (
                                    <div className="alert alert-error">
                                        <span>{searchState.error}</span>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className={`btn btn-primary w-full ${isPending ? 'loading' : ''}`}
                                    disabled={isPending}
                                >
                                    {isPending ? 'LOT 검색 중...' : 'LOT 검색'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 w-full items-center border  border-gray-200 rounded-lg p-6 mt-6">
                    <label className="select">
                        <span className="label">아이템</span>
                        <select>
                            <option>Personal</option>
                            <option>Business</option>
                        </select>
                    </label>
                    <label className="select">
                        <span className="label">Type</span>
                        <select>
                            <option>Personal</option>
                            <option>Business</option>
                        </select>
                    </label>
                    <label className="select">
                        <span className="label">Type</span>
                        <select>
                            <option>Personal</option>
                            <option>Business</option>
                        </select>
                    </label>
                    <button className="btn btn-primary btn-block" onClick={handleDraw}>그리기</button>
                </div>
            </div>
        </div>

    );
};

export default SearchTabs;
