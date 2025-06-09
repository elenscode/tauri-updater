import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    bearerToken: string | null;
    tokenExpiryTime: number | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    checkTokenExpiry: () => void;
}

export const useAuthStore = create<AuthState>()(
    // persist(
    (set, get) => ({
        isAuthenticated: false,
        bearerToken: null,
        tokenExpiryTime: null,

        login: async (username: string, password: string) => {
            // Mock 로그인 - 어떤 값이든 허용
            if (username && password) {
                const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const expiryTime = Date.now() + 10 * 60 * 1000; // 10분 후 만료

                set({
                    isAuthenticated: true,
                    bearerToken: mockToken,
                    tokenExpiryTime: expiryTime,
                });

                return true;
            }
            return false;
        },

        logout: () => {
            set({
                isAuthenticated: false,
                bearerToken: null,
                tokenExpiryTime: null,
            });
        },

        refreshToken: async () => {
            const { isAuthenticated } = get();
            if (!isAuthenticated) return;

            // Mock 토큰 갱신
            const newToken = `refreshed_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newExpiryTime = Date.now() + 10 * 60 * 1000; // 10분 후 만료

            set({
                bearerToken: newToken,
                tokenExpiryTime: newExpiryTime,
            });

            console.log('토큰이 갱신되었습니다:', newToken);
        }, checkTokenExpiry: () => {
            const { tokenExpiryTime, refreshToken } = get();
            if (tokenExpiryTime && Date.now() >= tokenExpiryTime) {
                // 토큰이 만료된 경우 자동 갱신
                refreshToken();
            }
        },
    }),
    //     {
    //         name: 'auth-store',
    //         partialize: (state) => ({
    //             isAuthenticated: state.isAuthenticated,
    //             bearerToken: state.bearerToken,
    //             tokenExpiryTime: state.tokenExpiryTime,
    //         }),
    //     }
    // )
);

// 10분마다 토큰 만료 체크 및 갱신
setInterval(() => {
    const store = useAuthStore.getState();
    if (store.isAuthenticated) {
        store.checkTokenExpiry();
    }
}, 60 * 1000); // 1분마다 체크
