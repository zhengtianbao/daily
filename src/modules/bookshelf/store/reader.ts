import { create } from 'zustand';

export interface ReaderState {
  isAppBarVisible: boolean;
  isSettingsVisible: boolean;
  isAssistantVisible: boolean;
  pressAt: number;
  selectedWord: string;
  selectedSentence: string;
  setIsAppBarVisible: (visible: boolean) => void;
  setIsSettingsVisible: (visible: boolean) => void;
  setIsAssistantVisible: (visible: boolean) => void;
  setPressAt: (pressAt: number) => void;
  setSelectedWord: (word: string) => void;
  setSelectedSentence: (sentence: string) => void;
}

export const useReaderStore = create<ReaderState>()(set => ({
  isAppBarVisible: false,
  isSettingsVisible: false,
  isAssistantVisible: false,
  pressAt: 0,
  selectedWord: '',
  selectedSentence: '',

  setIsAppBarVisible: (visible: boolean) => set({ isAppBarVisible: visible }),
  setIsSettingsVisible: (visible: boolean) => set({ isSettingsVisible: visible }),
  setIsAssistantVisible: (visible: boolean) => set({ isAssistantVisible: visible }),
  setPressAt: (pressAt: number) => set({ pressAt: pressAt }),
  setSelectedWord: (word: string) => set({ selectedWord: word }),
  setSelectedSentence: (sentence: string) => set({ selectedSentence: sentence }),
}));
