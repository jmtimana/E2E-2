import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTripById, completeTrip } from "../services/Drivers";
import type { Trip } from "../types/trips.type";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

function DriverTripDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    getTripById(Number(id)).then(setTrip);
  }, [isAuthenticated, id]);

  async function handleComplete() {
    if (!trip) return;
    setError("");
    try {
      const updated = await completeTrip(trip.id);
      setTrip(updated);
    } catch {
      setError("No se pudo completar el viaje.");
    }
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <p className="text-gray-400">Cargando viaje...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate("/driver")} className="text-blue-400 hover:underline mb-4 block">
          &larr; Volver
        </button>

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">Viaje #{trip.id}</h1>
          <StatusBadge status={trip.status} />
        </div>

        <div className="bg-gray-800 p-6 rounded flex flex-col gap-4">
          <div>
            <p className="text-sm text-gray-400">Recogida</p>
            <p className="font-medium">{trip.pickupAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Destino</p>
            <p className="font-medium">{trip.dropoffAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Pasajero</p>
            <p className="font-medium">
              {trip.passenger.firstName} {trip.passenger.lastName}
            </p>
            <p className="text-sm text-gray-400">{trip.passenger.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Solicitado</p>
            <p className="font-medium">{new Date(trip.requestedAt).toLocaleString("es-PE")}</p>
          </div>
          {trip.acceptedAt && (
            <div>
              <p className="text-sm text-gray-400">Aceptado</p>
              <p className="font-medium">{new Date(trip.acceptedAt).toLocaleString("es-PE")}</p>
            </div>
          )}
          {trip.completedAt && (
            <div>
              <p className="text-sm text-gray-400">Completado</p>
              <p className="font-medium">{new Date(trip.completedAt).toLocaleString("es-PE")}</p>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        {trip.status === "IN_PROGRESS" && (
          <div className="mt-6">
            <Button onClick={handleComplete}>Completar viaje</Button>
          </div>
        )}

        {trip.status === "COMPLETED" && (
          <div className="mt-6 bg-green-900/40 border border-green-600 p-4 rounded">
            <p className="font-semibold text-green-400 mb-1">Viaje completado ✓</p>
            <p className="text-sm text-gray-300">
              {trip.pickupAddress} → {trip.dropoffAddress}
            </p>
            {trip.passengerRating != null && (
              <p className="text-sm text-yellow-400 mt-2">
                Calificación del pasajero: {trip.passengerRating} ★
                {trip.ratingComment ? ` — "${trip.ratingComment}"` : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverTripDetail;
