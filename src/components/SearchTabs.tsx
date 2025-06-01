import React from 'react';
import { useProductStore } from '../store/useProductStore';

interface SearchTabsProps {
    onSearch?: () => void;
}

const SearchTabs: React.FC<SearchTabsProps> = ({ onSearch }) => {
    const { product, step, startDate, endDate, setProductData } = useProductStore();
    const [part, setPart] = React.useState('');

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
    // 검색 버튼 클릭 시 store 값으로 검색
    const handleSearch = () => {
        if (onSearch) onSearch();
    };

    return (
        <div className="w-80 card bg-base-200 shadow-sm">
            <div className="card-body p-4">
                <div className="space-y-4 bg-base-100 border-base-300 rounded-box p-4">
                    <div>
                        <h3 className="text-base font-medium mb-3">제품</h3>
                        <select className="select select-bordered select-primary w-full" value={product} onChange={handleProductChange}>
                            <option value="V1">V1</option>
                            <option value="V2">V2</option>
                            <option value="V3">V3</option>
                        </select>
                    </div>
                    <div>
                        <h3 className="text-base font-medium mb-3">스텝</h3>
                        <select className="select select-bordered select-primary w-full" value={step} onChange={handleStepChange}>
                            <option value="H">H</option>
                            <option value="C">C</option>
                            <option value="L">L</option>
                        </select>
                    </div>
                </div>
                <div className="tabs tabs-lifted">
                    <input type="radio" name="search_tabs" className="tab" aria-label="일반 검색" defaultChecked />
                    <div className="tab-content bg-base-100 border-base-300 rounded-box p-4">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-medium mb-3">기간</h3>
                                <div className="space-y-3">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">시작</span>
                                        </label>
                                        <input type="date" className="input input-bordered input-primary" value={startDate} onChange={handleStartDateChange} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">종료</span>
                                        </label>
                                        <input type="date" className="input input-bordered input-primary" value={endDate} onChange={handleEndDateChange} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-medium mb-3">파트 (옵션)</h3>
                                <input type="text" className="input input-bordered input-primary w-full" placeholder="파트명 입력" value={part} onChange={handlePartChange} />
                            </div>
                            <button className="btn btn-primary w-full" onClick={handleSearch}>검색</button>
                        </div>
                    </div>

                    <input type="radio" name="search_tabs" className="tab" aria-label="LOT 검색" />
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
