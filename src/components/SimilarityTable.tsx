import React, { useState, useEffect } from 'react';
import { calculateImageSimilarities, getSimilarityCacheStatus } from '../api/similarityApi';
import type { SimilarityResult } from '../api/similarityApi';

interface SimilarityTableProps {
    selectedImageIds: string[];
    onImageSelect?: (imageId: string) => void;
}

const SimilarityTable: React.FC<SimilarityTableProps> = ({
    selectedImageIds,
    onImageSelect
}) => {
    const [similarities, setSimilarities] = useState<SimilarityResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cacheStatus, setCacheStatus] = useState<{ count: number; image_ids: string[] } | null>(null);

    useEffect(() => {
        loadCacheStatus();
    }, []);

    useEffect(() => {
        if (selectedImageIds.length > 0) {
            calculateSimilarities();
        } else {
            setSimilarities([]);
        }
    }, [selectedImageIds]);

    const loadCacheStatus = async () => {
        try {
            const status = await getSimilarityCacheStatus();
            setCacheStatus(status);
        } catch (error) {
            console.error('Failed to load cache status:', error);
        }
    };

    const calculateSimilarities = async () => {
        if (selectedImageIds.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const results = await calculateImageSimilarities(selectedImageIds);
            setSimilarities(results);
        } catch (error) {
            setError(error instanceof Error ? error.message : '유사도 계산 중 오류가 발생했습니다.');
            console.error('Failed to calculate similarities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatSimilarity = (similarity: number) => {
        return (similarity * 100).toFixed(2) + '%';
    };

    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 0.8) return 'text-green-600 font-bold';
        if (similarity >= 0.6) return 'text-blue-600 font-semibold';
        if (similarity >= 0.4) return 'text-yellow-600';
        if (similarity >= 0.2) return 'text-orange-600';
        return 'text-red-600';
    };

    if (selectedImageIds.length === 0) {
        return (
            <div className="p-6 bg-base-200 rounded-lg">
                <div className="text-center">
                    <div className="text-gray-500 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">유사도 분석</h3>
                    <p className="text-gray-600">
                        이미지를 선택하면 유사한 이미지들을 찾아 테이블로 보여드립니다.
                    </p>
                    {cacheStatus && (
                        <div className="mt-4 text-sm text-gray-500">
                            캐시된 이미지: {cacheStatus.count}개
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            유사도 분석 결과
                        </h3>
                        <p className="text-sm text-gray-600">
                            선택된 {selectedImageIds.length}개 이미지와 유사한 이미지들
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={calculateSimilarities}
                            disabled={isLoading}
                            className="btn btn-primary btn-sm"
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    계산 중...
                                </>
                            ) : (
                                '다시 계산'
                            )}
                        </button>
                        <button
                            onClick={loadCacheStatus}
                            className="btn btn-outline btn-sm"
                        >
                            캐시 상태
                        </button>
                    </div>
                </div>

                {cacheStatus && (
                    <div className="mt-2 text-sm text-gray-500">
                        캐시된 이미지: {cacheStatus.count}개 | 분석 대상: {similarities.length}개
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-error">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="loading loading-spinner loading-lg mb-4"></div>
                        <p className="text-gray-600">유사도를 계산하고 있습니다...</p>
                    </div>
                </div>
            )}

            {/* Results Table */}
            {!isLoading && similarities.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr className="bg-base-200">
                                    <th className="text-left">순위</th>
                                    <th className="text-left">이미지 ID</th>
                                    <th className="text-left">유사도</th>
                                    <th className="text-left">작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {similarities.map((result, index) => (
                                    <tr key={result.image_id} className="hover:bg-base-100">
                                        <td className="font-medium">
                                            <div className="badge badge-outline">
                                                #{index + 1}
                                            </div>
                                        </td>
                                        <td className="font-mono text-sm">
                                            {result.image_id}
                                        </td>
                                        <td className={getSimilarityColor(result.similarity)}>
                                            {formatSimilarity(result.similarity)}
                                        </td>
                                        <td>
                                            {onImageSelect && (
                                                <button
                                                    onClick={() => onImageSelect(result.image_id)}
                                                    className="btn btn-ghost btn-sm"
                                                >
                                                    선택
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* No Results */}
            {!isLoading && similarities.length === 0 && selectedImageIds.length > 0 && (
                <div className="text-center py-8 bg-base-100 rounded-lg">
                    <div className="text-gray-500 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.54-.94-6.14-2.6C4.46 11.02 3.5 8.82 3.5 6.5S4.46 1.98 5.86.4C7.46-1.06 9.66-2 12-2s4.54.94 6.14 2.4c1.4 1.58 2.36 3.78 2.36 6.1s-.96 4.52-2.36 6.1z" />
                        </svg>
                    </div>
                    <p className="text-gray-600">
                        유사한 이미지를 찾지 못했습니다.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SimilarityTable;
