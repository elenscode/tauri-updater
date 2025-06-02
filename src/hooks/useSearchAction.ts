import { useState, useTransition, useCallback } from 'react';

export interface SearchActionState<T, E = string> {
    data?: T;
    error?: E;
    isLoading: boolean;
}

type SearchActionFn<T, P> = (params: P) => Promise<T>;

export function useSearchAction<T, P>(
    action: SearchActionFn<T, P>,
    initialState?: Partial<SearchActionState<T>>
) {
    const [state, setState] = useState<SearchActionState<T>>({
        isLoading: false,
        ...initialState,
    });

    const [isPending, startTransition] = useTransition();

    const execute = useCallback(
        (params: P) => {
            setState(prev => ({ ...prev, isLoading: true, error: undefined }));

            startTransition(() => {
                // The transition is for the state update, not the async logic
            });

            (async () => {
                try {
                    const result = await action(params);
                    setState({
                        data: result,
                        isLoading: false,
                    });
                } catch (error) {
                    setState({
                        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
                        isLoading: false,
                    });
                }
            })();
        },
        [action]
    );

    const reset = useCallback(() => {
        setState({ isLoading: false });
    }, []);

    return {
        state,
        execute,
        reset,
        isPending: isPending || state.isLoading,
    };
}
