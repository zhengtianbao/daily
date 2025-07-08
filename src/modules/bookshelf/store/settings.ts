import { create } from 'zustand';

import { database } from '@/db/database';

export type settings = {
  title: string;
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
};

export interface SettingsState {
  settings: settings;
  isLoading: boolean;
  setSettings: (settings: settings) => void;
  initializeSettings: (bookTitle: string) => Promise<void>;
}

const defaultSettings: settings = {
  title: '',
  fontSize: 20,
  fontFamily: 'serif',
  backgroundColor: '#ffffff',
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: defaultSettings,
  isLoading: false,

  setSettings: async (settings: settings) => {
    set({ settings: settings });
    await database.updateBookSettingsByBookTitle(
      settings.title,
      settings.backgroundColor,
      settings.fontFamily,
      settings.fontSize
    );
  },

  initializeSettings: async (bookTitle: string) => {
    set({ isLoading: true });
    try {
      const dbSettings = await database.getBookSettingsByBookTitle(bookTitle);
      if (dbSettings) {
        set({
          settings: {
            title: bookTitle,
            fontSize: dbSettings.fontSize,
            fontFamily: dbSettings.fontFamily,
            backgroundColor: dbSettings.backgroundColor,
          },
          isLoading: false,
        });
      } else {
        const defaultSettings: settings = {
          title: bookTitle,
          fontSize: 20,
          fontFamily: 'serif',
          backgroundColor: '#ffffff',
        };
        set({ settings: defaultSettings, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      set({ isLoading: false });
    }
  },
}));
