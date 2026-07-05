import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDriverAvailable } from "../services/Users";
import { requestTrip } from "../services/Drivers";
import type { User } from "../types/user.type";
import FormField from "../components/FormField";
import Button from "../components/Button";

function RequestTrip() {
  const { isAuthenticated } = useAuth();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    getDriverAvailable().then(setDrivers);
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const trip = await requestTrip(pickup, dropoff);
      navigate(`/trips/${trip.id}`);
    } catch {
      setError("No se pudo solicitar el viaje. Intenta de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/passenger")} className="text-blue-400 hover:underline mb-4 block">
          &larr; Volver al dashboard
        </button>
        <h1 className="text-2xl font-bold mb-6">Solicitar viaje</h1>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Conductores disponibles ({drivers.length})</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {drivers.length === 0 ? (
              <p className="text-gray-400">No hay conductores disponibles.</p>
            ) : (
              drivers.map((d) => (
                <div key={d.id} className="bg-gray-800 p-3 rounded min-w-40 flex-shrink-0">
                  <p className="font-medium">{d.firstName} {d.lastName}</p>
                  <p className="text-sm text-yellow-400">{d.rating.toFixed(1)} ★</p>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Detalles del viaje</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <FormField label="Dirección de recogida" value={pickup} onChange={setPickup} required />
          <FormField label="Dirección de destino" value={dropoff} onChange={setDropoff} required />
          <Button type="submit">Confirmar viaje</Button>
        </form>
      </div>
    </div>
  );
}

export default RequestTrip;
