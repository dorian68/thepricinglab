import { calibrateVolatilityModel } from '../lib/modelCalibration.mjs';

self.onmessage = (event) => {
  try {
    const { model, surface, options } = event.data ?? {};
    const result = calibrateVolatilityModel(model, surface, options);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : 'Calibration worker failed.',
    });
  }
};
