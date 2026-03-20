'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WorkerRequest, WorkerResponse } from '@/types';

type PendingResolve = (value: WorkerResponse) => void;

/**
 * Hook that manages a singleton Web Worker for PdG calculations.
 * Returns a `post` function for sending typed messages and receiving responses.
 */
export function useCalculatorWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingResolve>>(new Map());

  useEffect(() => {
    const worker = new Worker(
      new URL('./calculator.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const resolve = pendingRef.current.get(e.data.id);
      if (resolve) {
        resolve(e.data);
        pendingRef.current.delete(e.data.id);
      }
    };

    worker.onerror = (err) => {
      console.error('[Worker] Unhandled error:', err);
      // Reject all pending promises so the UI doesn't hang indefinitely
      const errorResponse = { id: '', type: 'ERROR' as const, message: err.message || 'Worker crashed' };
      pendingRef.current.forEach((resolve) => resolve(errorResponse));
      pendingRef.current.clear();
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const post = useCallback(
    <T extends WorkerResponse>(msg: Omit<WorkerRequest, 'id'>): Promise<T> => {
      return new Promise((resolve) => {
        const id = crypto.randomUUID();
        pendingRef.current.set(id, resolve as PendingResolve);
        workerRef.current?.postMessage({ ...msg, id });
      });
    },
    []
  );

  return { post };
}
