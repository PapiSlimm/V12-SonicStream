import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [pointer, setPointer] = useState(0);

  const set = useCallback((nextState: T | ((prev: T) => T)) => {
    const resolvedNext = typeof nextState === 'function' 
      ? (nextState as (prev: T) => T)(state) 
      : nextState;
      
    const newHistory = history.slice(0, pointer + 1);
    newHistory.push(resolvedNext);
    
    setHistory(newHistory);
    setPointer(newHistory.length - 1);
    setState(resolvedNext);
  }, [history, pointer, state]);

  const undo = useCallback(() => {
    if (pointer > 0) {
      const nextPointer = pointer - 1;
      setPointer(nextPointer);
      setState(history[nextPointer]);
    }
  }, [history, pointer]);

  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      const nextPointer = pointer + 1;
      setPointer(nextPointer);
      setState(history[nextPointer]);
    }
  }, [history, pointer]);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: pointer > 0,
    canRedo: pointer < history.length - 1
  };
}
