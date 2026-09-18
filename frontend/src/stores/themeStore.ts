import { defineStore } from 'pinia';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ThemeMode } from '../types';

const THEME_KEY = 'theme-mode';

export const useThemeStore = defineStore('theme', {
  state: () => {
    const { state, storageError } = useLocalStorage<ThemeMode>(THEME_KEY, 'light');
    return { mode: state, error: storageError };
  },
  actions: {
    toggle() {
      this.mode = this.mode === 'light' ? 'dark' : 'light';
      this.apply();
    },
    hydrate() {
      this.apply();
    },
    apply() {
      document.documentElement.dataset.theme = this.mode;
    }
  }
});
