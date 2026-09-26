import { useState, useEffect } from 'react';

export function useAutosave<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.warn('Error reading from localStorage', error);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Error writing to localStorage', error);
    }
  }, [key, value]);

  const clearValue = () => {
    try {
      window.localStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.warn('Error removing from localStorage', error);
    }
  };

  return [value, setValue, clearValue] as const;
}
