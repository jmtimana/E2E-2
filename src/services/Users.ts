    import type { User } from "../types/user.type";
    import api from "./api";

    export async function getMe(): Promise<User> {
    const response = await api.get<User>("/users/me");
    return response.data;
    }

    export async function getDriverAvailable(): Promise<User[]> {
    const response = await api.get<User[]>("/drivers/available");
    return response.data;
    }