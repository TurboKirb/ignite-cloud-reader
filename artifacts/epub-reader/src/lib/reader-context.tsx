import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeType = 'white' | 'sepia' | 'dark';

export interface ReaderSettings {
  fontFamily: string;
  letterSpacing: number;
  lineHeight: number;
  marginWidth: number;
  theme: ThemeType;
}

const defaultSettings: ReaderSettings = {
  fontFamily: 'Georgia',
  letterSpacing: 0,
  lineHeight: 1.5,
  marginWidth: 20,
  theme: 'white',
};

interface ReaderContextProps {
  settings: ReaderSettings;
  updateSettings: (newSettings: Partial<ReaderSettings>) => void;
  fileBuffer: ArrayBuffer | null;
  setFileBuffer: (buffer: ArrayBuffer | null) => void;
}

const ReaderContext = createContext<ReaderContextProps | undefined>(undefined);

export const ReaderProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('reader-settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Could not parse settings", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('reader-settings', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-sepia');
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'sepia') {
      root.classList.add('theme-sepia');
    }
  }, [settings.theme]);

  return (
    <ReaderContext.Provider value={{ settings, updateSettings, fileBuffer, setFileBuffer }}>
      {children}
    </ReaderContext.Provider>
  );
};

export const useReader = () => {
  const context = useContext(ReaderContext);
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
};
