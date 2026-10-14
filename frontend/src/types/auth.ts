// src/types/auth.ts
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    kycStatus: KycStatus;
    createdAt: string; // ISO 8601 Date string
}

// Nota: El Access Token se mantiene en memoria y no se tipa en el modelo de usuario por seguridad.