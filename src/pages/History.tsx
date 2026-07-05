import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyTrips, getMyDriverTrips } from "../services/Drivers";
import type { Trip, TripStatus } from "../types/trips.type";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

const statuses: (TripStatus | "ALL")[] = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"];

function History() {
  const { user, isAuthenticated, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<TripStatus | "ALL">("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const fetch = user?.role === "DRIVER" ? getMyDriverTrips : getMyTrips;
    fetch().then(setTrips);
  }, [isAuthenticated, user?.role, navigate]);

  if (!user) return null;

  const filtered = filter === "ALL" ? trips : trips.filter((t) => t.status === filter);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Historial de viajes</h1>
          <p className="text-gray-400 text-sm">{user.firstName} {user.lastName} — {user.role === "DRIVER" ? "Conductor" : "Pasajero"}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => navigate(user.role === "DRIVER" ? "/driver" : "/passenger")}>
            Dashboard
          </Button>
          <Button variant="secondary" onClick={logout}>Cerrar sesión</Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1 rounded text-sm font-medium ${
              filter === s ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {s === "ALL" ? "Todos" : s === "IN_PROGRESS" ? "IN PROGRESS" : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400">No hay viajes {filter !== "ALL" ? `con estado ${filter}` : ""}.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Origen</th>
                <th className="pb-3 pr-4">Destino</th>
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 pr-4">{user.role === "DRIVER" ? "Pasajero" : "Conductor"}</th>
                <th className="pb-3 pr-4">Rating</th>
                <th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trip) => (
                <tr
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                >
                  <td className="py-3 pr-4">{trip.id}</td>
                  <td className="py-3 pr-4 max-w-40 truncate">{trip.pickupAddress}</td>
                  <td className="py-3 pr-4 max-w-40 truncate">{trip.dropoffAddress}</td>
                  <td className="py-3 pr-4 text-sm text-gray-400">
                    {new Date(trip.requestedAt).toLocaleDateString("es-PE")}
                  </td>
                  <td className="py-3 pr-4">
                    {user.role === "DRIVER"
                      ? `${trip.passenger.firstName} ${trip.passenger.lastName}`
                      : trip.driver
                        ? `${trip.driver.firstName} ${trip.driver.lastName}`
                        : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {trip.passengerRating != null ? `${trip.passengerRating} ★` : "—"}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={trip.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
