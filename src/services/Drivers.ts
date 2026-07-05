import type { Trip } from "../types/trips.type";
import api from "./api";

export async function requestTrip(pickupAddress: string, dropoffAddress: string): Promise<Trip> {
  const response = await api.post<Trip>("/trips", { pickupAddress, dropoffAddress });
  return response.data;
}

export async function getMyTrips(): Promise<Trip[]> {
  const response = await api.get<Trip[]>("/trips");
  return response.data;
}

export async function getPendingTrips(): Promise<Trip[]> {
  const response = await api.get<Trip[]>("/trips/pending");
  return response.data;
}

export async function getMyDriverTrips(): Promise<Trip[]> {
  const response = await api.get<Trip[]>("/trips/my");
  return response.data;
}

export async function getTripById(id: number): Promise<Trip> {
  const response = await api.get<Trip>(`/trips/${id}`);
  return response.data;
}

export async function acceptTrip(id: number): Promise<Trip> {
  const response = await api.patch<Trip>(`/trips/${id}/accept`);
  return response.data;
}

export async function completeTrip(id: number): Promise<Trip> {
  const response = await api.patch<Trip>(`/trips/${id}/complete`);
  return response.data;
}

export async function rateTrip(id: number, rating: number, comment: string): Promise<Trip> {
  const response = await api.post<Trip>(`/trips/${id}/rate`, { rating, comment });
  return response.data;
}