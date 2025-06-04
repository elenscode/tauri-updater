import React, { memo, useState } from 'react';
import { IoSearch, IoGrid, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import SearchTabs from './SearchTabs';
import DataGrid from './DataGrid';
import { useImageDataStore } from '../store/useImageDataStore';

interface LeftSidebarProps {
    onSearch?: () => void;
}

type ActivePanel = 'search' | 'data' | null;

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onSearch }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);

    // 필요한 상태 구독
    const searchResults = useImageDataStore(state => state.searchResults);
    const selectedGridItems = useImageDataStore(state => state.selectedGridItems);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
        if (!isCollapsed) {
            setActivePanel(null); // 접을 때 패널도 닫기
        }
    };

    const togglePanel = (panel: ActivePanel) => {
        if (isCollapsed) {
            setIsCollapsed(false);
        }
        setActivePanel(activePanel === panel ? null : panel);
    };

    return (
        <div className="flex h-full">
            {/* 사이드바 아이콘 바 */}
            <div className="bg-base-300 w-12 flex flex-col items-center py-4 gap-2 border-r border-base-content/10">
                {/* 검색 탭 버튼 */}
                <button
                    className={`btn btn-ghost btn-sm w-10 h-10 p-0 ${activePanel === 'search' ? 'btn-primary' : ''
                        }`}
                    onClick={() => togglePanel('search')}
                    title="검색"
                >
                    <IoSearch size={18} />
                </button>

                {/* 데이터 그리드 버튼 */}
                <button
                    className={`btn btn-ghost btn-sm w-10 h-10 p-0 ${activePanel === 'data' ? 'btn-primary' : ''
                        }`}
                    onClick={() => togglePanel('data')}
                    title="데이터 그리드"
                >
                    <IoGrid size={18} />
                </button>

                {/* 구분선 */}
                <div className="divider my-2 h-px bg-base-content/20"></div>                {/* 접기/펼치기 버튼 */}
                <button
                    className="btn btn-ghost btn-sm w-10 h-10 p-0 mt-auto"
                    onClick={toggleCollapse}
                    title={isCollapsed ? "펼치기" : "접기"}
                >
                    {isCollapsed ? <IoChevronForward size={16} /> : <IoChevronBack size={16} />}
                </button>
            </div>

            {/* 드로어 패널 */}
            <div
                className={`bg-base-200 transition-all duration-300 ease-in-out border-r border-base-content/10 ${isCollapsed || !activePanel ? 'w-0' : 'w-xl'
                    } overflow-hidden`}
            >
                {activePanel === 'search' && (
                    <div className="h-full p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <IoSearch size={20} className="text-primary" />
                            <h3 className="text-lg font-semibold">검색</h3>
                        </div>
                        <div className="h-full overflow-auto">
                            <SearchTabs onSearch={onSearch} />
                        </div>
                    </div>
                )}

                {activePanel === 'data' && (
                    <div className="h-full p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <IoGrid size={20} className="text-primary" />
                            <h3 className="text-lg font-semibold">데이터 그리드</h3>
                        </div>

                        <div className="text-sm text-base-content/70 mb-3">
                            총 {searchResults.length}개 항목 • 선택됨: {selectedGridItems.size}개
                        </div>

                        <div className="flex-1 min-h-0">
                            <div className="h-full bg-base-100 rounded-lg border border-base-content/10">
                                <DataGrid />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(LeftSidebar);
