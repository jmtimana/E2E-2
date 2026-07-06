import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyTrips } from "../services/Drivers";
import type { Trip } from "../types/trips.type";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

function PassengerDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    getMyTrips().then(setTrips);
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Bienvenido, {user.firstName}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/passenger/request")}>
            Solicitar viaje
          </Button>
          <Button variant="secondary" onClick={() => navigate("/history")}>
            Historial
          </Button>
          <Button variant="secondary" onClick={logout}>
            Cerrar sesion
          </Button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Mis viajes</h2>
      {trips.length === 0 ? (
        <p className="text-gray-400">Aun no tienes viajes.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-gray-800 p-4 rounded flex justify-between items-center cursor-pointer hover:bg-gray-700"
              onClick={() => navigate(`/trips/${trip.id}`)}
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium">{trip.pickupAddress} a {trip.dropoffAddress}</p>
                <p className="text-sm text-gray-400">
                  {new Date(trip.requestedAt).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <StatusBadge status={trip.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PassengerDashboard;
