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
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-base-100 rounded-xl shadow-md p-8">
                <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">유사도 분석</h3>
                    <p className="text-gray-500 mb-2">이미지를 선택하면 유사한 이미지들을 테이블로 보여드립니다.</p>
                    {cacheStatus && (
                        <div className="mt-2 text-sm text-gray-400">
                            캐시된 이미지: <span className="font-semibold text-blue-600">{cacheStatus.count}</span>개
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-base-100 rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">유사도 분석 결과</h3>
                    <p className="text-sm text-gray-500">
                        선택된 <span className="font-semibold text-blue-600">{selectedImageIds.length}</span>개 이미지와 유사한 이미지들
                    </p>
                </div>
                {cacheStatus && (
                    <div className="text-sm text-gray-400">
                        캐시된 이미지: <span className="font-semibold text-blue-600">{cacheStatus.count}</span>개 | 분석 대상: <span className="font-semibold text-green-600">{similarities.length}</span>개
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-error flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-4">
                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                    </div>
                    <p className="text-gray-500 text-lg">유사도를 계산하고 있습니다...</p>
                </div>
            )}

            {/* Results Table */}
            {!isLoading && similarities.length > 0 && (
                <div className="rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-base-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">순위</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">이미지 ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">유사도</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {similarities.map((result, index) => (
                                    <tr key={result.image_id} className="hover:bg-base-100 transition">
                                        <td className="px-4 py-2 font-medium">
                                            <span className="badge badge-outline bg-base-200">{index + 1}</span>
                                        </td>
                                        <td className="px-4 py-2 font-mono text-sm text-gray-700">
                                            {result.image_id}
                                        </td>
                                        <td className={getSimilarityColor(result.similarity) + ' px-4 py-2 text-sm'}>
                                            {formatSimilarity(result.similarity)}
                                        </td>
                                        <td className="px-4 py-2">
                                            {onImageSelect && (
                                                <button
                                                    onClick={() => onImageSelect(result.image_id)}
                                                    className="btn btn-ghost btn-xs border border-gray-300 hover:bg-blue-50"
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
                <div className="flex flex-col items-center justify-center py-12 bg-base-100 rounded-xl shadow">
                    <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.54-.94-6.14-2.6C4.46 11.02 3.5 8.82 3.5 6.5S4.46 1.98 5.86.4C7.46-1.06 9.66-2 12-2s4.54.94 6.14 2.4c1.4 1.58 2.36 3.78 2.36 6.1s-.96 4.52-2.36 6.1z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-lg">유사한 이미지를 찾지 못했습니다.</p>
                </div>
            )}
        </div>
    );
};

export default SimilarityTable;
