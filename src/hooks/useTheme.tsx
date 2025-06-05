import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // 시스템 테마 감지 함수
    const getSystemTheme = (): Theme => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    };

    // 저장된 테마 가져오기 또는 시스템 테마 사용
    const getInitialTheme = (): Theme => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme;
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                return savedTheme;
            }
        }
        return getSystemTheme();
    };

    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    // 테마 적용 함수
    const applyTheme = (newTheme: Theme) => {
        if (typeof window !== 'undefined') {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }
    };

    // 테마 설정 함수
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        applyTheme(newTheme);
    };

    // 테마 토글 함수
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // 시스템 테마 변경 감지
    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleChange = (e: MediaQueryListEvent) => {
                // 사용자가 명시적으로 테마를 설정하지 않은 경우에만 시스템 테마 따르기
                const savedTheme = localStorage.getItem('theme');
                if (!savedTheme) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    setThemeState(systemTheme);
                    applyTheme(systemTheme);
                }
            };

            // 이벤트 리스너 등록
            mediaQuery.addEventListener('change', handleChange);

            return () => {
                mediaQuery.removeEventListener('change', handleChange);
            };
        }
    }, []);

    // 초기 테마 적용
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const value: ThemeContextType = {
        theme,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
