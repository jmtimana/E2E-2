import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTripById } from "../services/Drivers";
import type { Trip } from "../types/trips.type";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

function TripDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    getTripById(Number(id)).then(setTrip);
  }, [isAuthenticated, id]);

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <p className="text-gray-400">Cargando viaje...</p>
      </div>
    );
  }

  const backRoute = trip.passenger.role === "DRIVER" ? "/driver" : "/passenger";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(backRoute)} className="text-blue-400 hover:underline mb-4 block">
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
            <p className="text-sm text-gray-400">Solicitado</p>
            <p className="font-medium">
              {new Date(trip.requestedAt).toLocaleString("es-PE")}
            </p>
          </div>

          {trip.driver ? (
            <div>
              <p className="text-sm text-gray-400">Conductor</p>
              <p className="font-medium">
                {trip.driver.firstName} {trip.driver.lastName} — {trip.driver.rating.toFixed(1)} ★
              </p>
            </div>
          ) : (
            <p className="text-yellow-400">Buscando conductor...</p>
          )}

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

        <div className="mt-6 flex gap-4">
          <Button variant="secondary" onClick={() => navigate(backRoute)}>
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TripDetail;
