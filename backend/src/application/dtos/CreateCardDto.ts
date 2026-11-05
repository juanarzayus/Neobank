export interface CreateCardDto {
  userId: string;
  cardholderName: string;
  monthlyLimit: number;
  dailyLimit: number | null;
  internationalAllowed: boolean;
  blockedCategories: string[];
  /** Monto de carga inicial en el saldo prepago de la tarjeta (0 = sin carga inicial). */
  initialBalance?: number;
  /** Si es true, permite descontar el faltante directamente de la cuenta principal CHECKING. */
  autoDebitFromAccount?: boolean;
}
