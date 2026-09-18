import { defineStore } from 'pinia';
import { ThemeMode } from '../types';

function readTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem('theme-mode');
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  } catch {
    return 'light';
  }
}

function persistTheme(mode: ThemeMode) {
  try {
    localStorage.setItem('theme-mode', mode);
  } catch {
    /* 主题为可恢复的偏好，存储失败时仅本次会话生效 */
  }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({ mode: readTheme() }),
  actions: {
    toggle() {
      this.mode = this.mode === 'light' ? 'dark' : 'light';
      persistTheme(this.mode);
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
