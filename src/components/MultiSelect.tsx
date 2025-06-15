import React from "react";
import Select, { MultiValue, StylesConfig } from "react-select";

export type OptionType = {
  label: string;
  value: string | number;
};

interface MultiSelectProps {
  value: OptionType[];
  options: OptionType[];
  onChange: (selected: OptionType[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
}

// react-select 커스텀 스타일
const customStyles: StylesConfig<OptionType, true> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "40px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    borderRadius: "6px",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#dbeafe",
    borderRadius: "4px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#1e40af",
    fontSize: "12px",
    fontWeight: "500",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#3b82f6",
    "&:hover": {
      backgroundColor: "#bfdbfe",
      color: "#1e40af",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#f3f4f6"
      : "white",
    color: state.isSelected ? "white" : "#374151",
    fontSize: "14px",
    "&:hover": {
      backgroundColor: state.isSelected ? "#3b82f6" : "#f3f4f6",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#6b7280",
    fontSize: "14px",
  }),
  input: (provided) => ({
    ...provided,
    fontSize: "14px",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: "240px",
    borderRadius: "6px",
  }),
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = "선택하세요",
  isDisabled = false,
  className = "",
}) => {
  const handleChange = (selectedOptions: MultiValue<OptionType>) => {
    onChange(selectedOptions as OptionType[]);
  };

  return (
    <div className={`w-64 ${className}`}>
      <Select<OptionType, true>
        isMulti
        value={value}
        options={options}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isSearchable
        isClearable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        styles={customStyles}
        noOptionsMessage={() => "검색 결과가 없습니다."}
        loadingMessage={() => "로딩 중..."}
      />
    </div>
  );
};

export default MultiSelect;
