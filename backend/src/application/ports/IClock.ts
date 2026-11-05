/** Fuente de la hora actual; permite fijar el tiempo en pruebas. */
export interface IClock {
  now(): Date;
}
