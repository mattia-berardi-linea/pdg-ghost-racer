import type { WorkerRequest, WorkerResponse } from '@/types';
import { runSimulation } from '@/lib/ghostSimulator';
import { normalizeProfile } from '@/lib/profileNormalizer';

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, type } = e.data;

  try {
    if (type === 'SIMULATE') {
      const result = runSimulation(e.data.payload);
      const response: WorkerResponse = { id, type: 'SIMULATION_RESULT', result };
      self.postMessage(response);
    } else if (type === 'NORMALIZE_PROFILE') {
      const result = normalizeProfile(e.data.payload.activities);
      const response: WorkerResponse = { id, type: 'PROFILE_RESULT', result };
      self.postMessage(response);
    }
  } catch (err) {
    const response: WorkerResponse = {
      id,
      type: 'ERROR',
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
