import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  danger: string;
}

export const themes: Theme[] = [
  {
    id: 'orange',
    name: 'Orange & White',
    primary: '#FF6B35',
    secondary: '#FF8C42',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#FF6B35',
    success: '#4CAF50',
    danger: '#F44336',
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    primary: '#2196F3',
    secondary: '#64B5F6',
    background: '#FFFFFF',
    surface: '#E3F2FD',
    text: '#000000',
    textSecondary: '#666666',
    border: '#2196F3',
    success: '#4CAF50',
    danger: '#F44336',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    primary: '#9C27B0',
    secondary: '#BA68C8',
    background: '#FFFFFF',
    surface: '#F3E5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#9C27B0',
    success: '#4CAF50',
    danger: '#F44336',
  },
  {
    id: 'green',
    name: 'Forest Green',
    primary: '#4CAF50',
    secondary: '#81C784',
    background: '#FFFFFF',
    surface: '#E8F5E9',
    text: '#000000',
    textSecondary: '#666666',
    border: '#4CAF50',
    success: '#66BB6A',
    danger: '#F44336',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    primary: '#BB86FC',
    secondary: '#03DAC6',
    background: '#121212',
    surface: '#2D1B69',
    text: '#FFFFFF',
    textSecondary: '#E0E0E0',
    border: '#BB86FC',
    success: '#4CAF50',
    danger: '#CF6679',
  },
  {
    id: 'red',
    name: 'Cherry Red',
    primary: '#F44336',
    secondary: '#EF5350',
    background: '#FFFFFF',
    surface: '#FFEBEE',
    text: '#000000',
    textSecondary: '#666666',
    border: '#F44336',
    success: '#4CAF50',
    danger: '#D32F2F',
  },
  {
    id: 'teal',
    name: 'Teal Wave',
    primary: '#009688',
    secondary: '#4DB6AC',
    background: '#FFFFFF',
    surface: '#E0F2F1',
    text: '#000000',
    textSecondary: '#666666',
    border: '#009688',
    success: '#4CAF50',
    danger: '#F44336',
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    primary: '#FFC107',
    secondary: '#FFD54F',
    background: '#FFFFFF',
    surface: '#FFF8E1',
    text: '#000000',
    textSecondary: '#666666',
    border: '#FFC107',
    success: '#4CAF50',
    danger: '#F44336',
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    primary: '#3F51B5',
    secondary: '#7986CB',
    background: '#FFFFFF',
    surface: '#E8EAF6',
    text: '#000000',
    textSecondary: '#666666',
    border: '#3F51B5',
    success: '#4CAF50',
    danger: '#F44336',
  },
  {
    id: 'pink',
    name: 'Rose Pink',
    primary: '#E91E63',
    secondary: '#F06292',
    background: '#FFFFFF',
    surface: '#FCE4EC',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E91E63',
    success: '#4CAF50',
    danger: '#F44336',
  },
  {
    id: 'brown',
    name: 'Earth Brown',
    primary: '#795548',
    secondary: '#A1887F',
    background: '#FFFFFF',
    surface: '#EFEBE9',
    text: '#000000',
    textSecondary: '#666666',
    border: '#795548',
    success: '#4CAF50',
    danger: '#F44336',
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    primary: '#00BCD4',
    secondary: '#4DD0E1',
    background: '#FFFFFF',
    surface: '#E0F7FA',
    text: '#000000',
    textSecondary: '#666666',
    border: '#00BCD4',
    success: '#4CAF50',
    danger: '#F44336',
  },
];

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem('selectedTheme');
      if (savedThemeId) {
        const theme = themes.find(t => t.id === savedThemeId);
        if (theme) {
          setCurrentTheme(theme);
        }
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const selectTheme = useCallback(async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      try {
        await AsyncStorage.setItem('selectedTheme', themeId);
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  }, []);

  return useMemo(() => ({
    currentTheme,
    themes,
    selectTheme,
  }), [currentTheme, selectTheme]);
});