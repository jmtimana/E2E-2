import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPendingTrips, getMyDriverTrips, acceptTrip } from "../services/Drivers";
import type { Trip } from "../types/trips.type";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

function DriverDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [pending, setPending] = useState<Trip[]>([]);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function load() {
    const [pendingTrips, driverTrips] = await Promise.all([
      getPendingTrips(),
      getMyDriverTrips(),
    ]);
    setPending(pendingTrips);
    setMyTrips(driverTrips);
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    load();
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const activeTrip = myTrips.find((t) => t.status === "IN_PROGRESS");

  async function handleAccept(id: number) {
    setError("");
    try {
      await acceptTrip(id);
      navigate(`/driver/trips/${id}`);
    } catch {
      setError("No se pudo aceptar el viaje, puede que ya no este disponible.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Bienvenido, {user.firstName}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <p className="text-yellow-400 text-sm mt-1">Tu rating: {user.rating.toFixed(1)} estrellas</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => navigate("/history")}>
            Historial
          </Button>
          <Button variant="secondary" onClick={logout}>
            Cerrar sesion
          </Button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {activeTrip && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Viaje activo</h2>
          <div className="bg-gray-800 border border-blue-500 p-6 rounded flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <p className="font-medium">
                  {activeTrip.pickupAddress} a {activeTrip.dropoffAddress}
                </p>
                <StatusBadge status={activeTrip.status} />
              </div>
              <p className="text-sm text-gray-400">
                Pasajero: {activeTrip.passenger.firstName} {activeTrip.passenger.lastName}
              </p>
            </div>
            <Button onClick={() => navigate(`/driver/trips/${activeTrip.id}`)}>
              Completar viaje
            </Button>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Viajes disponibles</h2>
      {pending.length === 0 ? (
        <p className="text-gray-400">No hay viajes pendientes por ahora.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((trip) => (
            <div
              key={trip.id}
              className="bg-gray-800 p-4 rounded flex justify-between items-center"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <p className="font-medium">
                    {trip.pickupAddress} a {trip.dropoffAddress}
                  </p>
                  <StatusBadge status={trip.status} />
                </div>
                <p className="text-sm text-gray-400">
                  Pasajero: {trip.passenger.firstName} {trip.passenger.lastName} -{" "}
                  {new Date(trip.requestedAt).toLocaleString("es-PE")}
                </p>
              </div>
              <Button onClick={() => handleAccept(trip.id)} disabled={!!activeTrip}>
                Aceptar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
