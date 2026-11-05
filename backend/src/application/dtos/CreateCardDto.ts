export interface CreateCardDto {
  userId: string;
  cardholderName: string;
  monthlyLimit: number;
  dailyLimit: number | null;
  internationalAllowed: boolean;
  blockedCategories: string[];
}
