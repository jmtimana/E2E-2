export type Role = 'PASSENGER' | 'DRIVER';

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    available: boolean;
    rating: number;
}