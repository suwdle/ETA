"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createDefaultAppData } from "@/data/defaults";
import { loadAppData, saveAppData } from "@/lib/storage";
import type { AppData } from "@/types";

interface AppDataContextValue {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  isReady: boolean;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(createDefaultAppData);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted) return;
      setData(loadAppData());
      setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isReady) saveAppData(data);
  }, [data, isReady]);

  return (
    <AppDataContext.Provider value={{ data, setData, isReady }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData는 AppDataProvider 내부에서 사용해야 합니다.");
  }
  return context;
}