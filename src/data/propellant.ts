/** Propelente único de todos los cohetes: KNSB (nitrato de potasio + sorbitol), propelente sólido "sugar rocket". */
export const KNSB = {
  name: "KNSB",
  fullName: "Nitrato de potasio / sorbitol",
  /** Impulso específico (s), igual para todos los motores */
  isp: 120,
  /** Densidad del grano (kg/m³) */
  density: 1800,
} as const;
