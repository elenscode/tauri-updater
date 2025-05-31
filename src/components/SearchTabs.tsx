import React from 'react';

interface SearchTabsProps {
    onSearch?: () => void;
}

const SearchTabs: React.FC<SearchTabsProps> = ({ onSearch }) => {
    return (
        <div className="w-80 card bg-base-200 shadow-sm">
            <div className="card-body p-4">
                <div className="mt-4 space-y-4">
                    <div>
                        <h3 className="text-base font-medium mb-3">제품</h3>
                        <select className="select select-bordered select-primary w-full">
                            <option>V1</option>
                            <option>V2</option>
                            <option>V3</option>
                        </select>
                    </div>
                    <div>
                        <h3 className="text-base font-medium mb-3">스텝</h3>
                        <select className="select select-bordered select-primary w-full">
                            <option>H</option>
                            <option>C</option>
                            <option>L</option>
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
                                        <input type="date" className="input input-bordered input-primary" defaultValue="2025-05-01" />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">종료</span>
                                        </label>
                                        <input type="date" className="input input-bordered input-primary" defaultValue="2025-05-10" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-medium mb-3">파트 (옵션)</h3>
                                <input type="text" className="input input-bordered input-primary w-full" placeholder="파트명 입력" />
                            </div>
                            <button className="btn btn-primary w-full" onClick={onSearch}>검색</button>
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
