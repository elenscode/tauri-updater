import React, { useState } from 'react';
import { useProductStore } from '../store/useProductStore';
import { useSearchAction } from '../hooks/useSearchAction';

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
    };
    const handlePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPart(e.target.value);
    };

    // 폼 제출 핸들러
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const searchData: SearchFormData = {
            product,
            step,
            startDate,
            endDate,
            part,
            searchType,
        };

        executeSearch(searchData);

        // 검색 완료 시 콜백 호출
        if (onSearch) {
            onSearch(searchData);
        }
    }; return (
        <div className="w-80 card bg-base-200 shadow-sm">
            <div className="card-body p-4">
                <div className="space-y-4 bg-base-100 border-base-300 rounded-box p-4">
                    <div>
                        <h3 className="text-base font-medium mb-3">제품</h3>
                        <select
                            className="select select-bordered select-primary w-full"
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
                        <h3 className="text-base font-medium mb-3">스텝</h3>
                        <select
                            className="select select-bordered select-primary w-full"
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
                <div className="tabs tabs-lifted">
                    <input
                        type="radio"
                        name="search_tabs"
                        className="tab"
                        aria-label="일반 검색"
                        defaultChecked
                        onChange={() => setSearchType('general')}
                    />
                    <div className="tab-content bg-base-100 border-base-300 rounded-box p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <h3 className="text-base font-medium mb-3">기간</h3>
                                <div className="space-y-3">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">시작</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input input-bordered input-primary"
                                            value={startDate}
                                            onChange={handleStartDateChange}
                                            name="startDate"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">종료</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input input-bordered input-primary"
                                            value={endDate}
                                            onChange={handleEndDateChange}
                                            name="endDate"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-medium mb-3">파트 (옵션)</h3>
                                <input
                                    type="text"
                                    className="input input-bordered input-primary w-full"
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
                        onChange={() => setSearchType('lot')}
                    />
                    <div className="tab-content bg-base-100 border-base-300 rounded-box p-4">
                        <div className="text-center text-base-content/50 py-8">
                            LOT 검색 기능 준비 중
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchTabs;
