import type { AccountMovement } from '../../../domain/entities/AccountMovement';
import type { IAccountMovementRepository } from '../../../domain/repositories/IAccountMovementRepository';
import type { ListMovementsDto } from '../../dtos/AccountDtos';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class ListAccountMovementsUseCase {
  constructor(private readonly movements: IAccountMovementRepository) {}

  async execute(dto: ListMovementsDto): Promise<AccountMovement[]> {
    const requested = dto.limit && Number.isFinite(dto.limit) ? Math.trunc(dto.limit) : DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requested, 1), MAX_LIMIT);
    return this.movements.findByAccount(dto.userId, dto.accountId, limit);
  }
}
