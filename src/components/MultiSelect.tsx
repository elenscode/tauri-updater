import React, { useState, useRef, useEffect } from "react";

type OptionType = {
    label: string;
    value: string | number;
};

interface MultiSelectProps {
    value: OptionType[];
    options: OptionType[];
    onChange: (selected: OptionType[]) => void;
    placeholder?: string;
    isDisabled?: boolean;
    maxDisplayCount?: number;
    className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    value,
    options,
    onChange,
    placeholder = "선택하세요",
    isDisabled = false,
    maxDisplayCount = 2,
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 외부 클릭시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 옵션 선택/해제
    const handleOptionClick = (option: OptionType) => {
        const isSelected = value.some(item => item.value === option.value);

        if (isSelected) {
            onChange(value.filter(item => item.value !== option.value));
        } else {
            onChange([...value, option]);
        }
    };

    // 개별 태그 제거
    const removeTag = (optionToRemove: OptionType) => {
        onChange(value.filter(item => item.value !== optionToRemove.value));
    };

    // 전체 클리어
    const clearAll = () => {
        onChange([]);
    };

    // 검색 필터링
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 표시할 라벨 생성
    const getDisplayText = () => {
        if (value.length === 0) return placeholder;

        if (value.length <= maxDisplayCount) {
            return value.map(item => item.label).join(", ");
        }

        const displayLabels = value.slice(0, maxDisplayCount).map(item => item.label).join(", ");
        return `${displayLabels} + ${value.length - maxDisplayCount} more`;
    };

    return (
        <div className={`relative w-64 ${className}`} ref={dropdownRef}>
            {/* 메인 입력 영역 */}
            <div
                className={`
                    min-h-[40px] px-3 py-2 border border-gray-300 rounded-md cursor-pointer
                    flex items-center justify-between bg-white
                    ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
                    ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
                `}
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
            >
                <div className="flex-1 flex flex-wrap gap-1 items-center">
                    {value.length <= maxDisplayCount ? (
                        // 개별 태그로 표시
                        value.length > 0 ? (
                            value.map((item) => (
                                <span
                                    key={item.value}
                                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
                                >
                                    {item.label}
                                    <button
                                        type="button"
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTag(item);
                                        }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500">{placeholder}</span>
                        )
                    ) : (
                        // Truncated 텍스트로 표시
                        <span className="text-gray-900 text-sm truncate hover:text-blue-800">
                            {getDisplayText()}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Clear 버튼 */}
                    {value.length > 0 && !isDisabled && (
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                clearAll();
                            }}
                        >
                            ×
                        </button>
                    )}

                    {/* 드롭다운 화살표 */}
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* 드롭다운 메뉴 */}
            {isOpen && !isDisabled && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {/* 검색 입력 */}
                    <div className="p-2 border-b border-gray-200">
                        <input
                            type="text"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* 옵션 리스트 */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                검색 결과가 없습니다.
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = value.some(item => item.value === option.value);
                                return (
                                    <div
                                        key={option.value}
                                        className={`
                                            px-3 py-2 cursor-pointer flex items-center gap-2 text-sm
                                            hover:bg-gray-100
                                            ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                                        `}
                                        onClick={() => handleOptionClick(option)}
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            checked={isSelected}
                                            onChange={() => { }} // 클릭 이벤트로 처리
                                        />
                                        <span className="flex-1">{option.label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelect;