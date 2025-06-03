import React, { useMemo, useCallback } from "react";
import { ColDef, colorSchemeDarkBlue, themeMaterial } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

import { AgGridReact } from "ag-grid-react";
import { ImageData } from '../types/image';
import { useImageDataStore } from '../store/useImageDataStore';
import { useTheme } from "../hooks/useTheme";

ModuleRegistry.registerModules([AllCommunityModule]);
const DataGrid = React.memo(() => {

    const { theme } = useTheme();
    // Custom Theme: Defines the grid's theme.
    const customTheme = useMemo(() => {
        return theme === 'dark' ? themeMaterial.withPart(colorSchemeDarkBlue) : themeMaterial;
    }, [theme]);

    // DataGrid에 필요한 상태만 선택적으로 구독
    const searchResults = useImageDataStore(state => state.searchResults);
    const selectedGridItems = useImageDataStore(state => state.selectedGridItems);
    const setSelectedGridItems = useImageDataStore(state => state.setSelectedGridItems);

    // Column Definitions: Defines & controls grid columns.
    const colDefs = useMemo<ColDef<ImageData>[]>(() => [
        {
            field: "id",
            headerName: "ID",
            width: 60
        },
        {
            field: "key",
            headerName: "키",
        },
        {
            field: "name",
            headerName: "이미지 이름",
            flex: 1
        }
    ], []);

    const defaultColDef: ColDef = {
        flex: 1,
        sortable: true,
        filter: true,
    };

    // 선택 변경 핸들러
    const onSelectionChanged = useCallback((event: any) => {
        const selectedRows = event.api.getSelectedRows();
        const selectedIds = new Set<string>(selectedRows.map((row: ImageData) => row.id));
        setSelectedGridItems(selectedIds);
    }, [setSelectedGridItems]);

    // 그리드 준비 완료 시 초기 선택 상태 설정
    const onGridReady = useCallback((params: any) => {
        // 선택된 항목이 있다면 그리드에 반영
        if (selectedGridItems.size > 0) {
            params.api.forEachNode((node: any) => {
                if (selectedGridItems.has(node.data.id)) {
                    node.setSelected(true);
                }
            });
        }
    }, [selectedGridItems]);    // Container: Defines the grid's theme & dimensions.
    return (
        <AgGridReact
            rowData={searchResults}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            rowSelection={{
                mode: "multiRow"
            }}
            theme={customTheme}
            onSelectionChanged={onSelectionChanged}
            onGridReady={onGridReady}
            className="w-full h-full" />);
});

DataGrid.displayName = "DataGrid";
export default DataGrid;