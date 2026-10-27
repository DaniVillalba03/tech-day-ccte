import type { FlightState, TelemetrySample } from "@/types/flight";

const SAMPLE_INTERVAL = 0.1;
const MAX_SAMPLES = 1500;

/** Registra (t, altitud, velocidad) en tiempo de simulación; decima a la mitad si crece demasiado. */
export class TelemetryRecorder {
  samples: TelemetrySample[] = [];
  private interval = SAMPLE_INTERVAL;
  private next = 0;

  record(s: FlightState, force = false) {
    if (!force && s.t < this.next) return;
    this.next = s.t + this.interval;
    this.samples.push({ t: s.t, altitude: s.y, speed: Math.hypot(s.vx, s.vy) });
    if (this.samples.length > MAX_SAMPLES) {
      this.samples = this.samples.filter((_, i) => i % 2 === 0);
      this.interval *= 2;
    }
  }

  reset() {
    this.samples = [];
    this.interval = SAMPLE_INTERVAL;
    this.next = 0;
  }
}
