/** Solo se actualizan los campos presentes. */
export interface UpdateLimitsDto {
  userId: string;
  cardId: string;
  monthlyLimit?: number;
  dailyLimit?: number | null;
  internationalAllowed?: boolean;
  blockedCategories?: string[];
}

export interface UpdateStatusDto {
  userId: string;
  cardId: string;
  status: string;
}
