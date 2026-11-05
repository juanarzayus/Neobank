/** 1234567890 -> 123-456-7890 (solo para mostrar). */
export const formatAccountNumber = (n: string | null | undefined): string =>
  n ? `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}` : '';

/** Copia texto al portapapeles; usa un respaldo si la API moderna no está disponible. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}
