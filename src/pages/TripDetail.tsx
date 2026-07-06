import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTripById, rateTrip } from "../services/Drivers";
import type { Trip } from "../types/trips.type";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

function TripDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    getTripById(Number(id)).then(setTrip);
  }, [isAuthenticated, id]);

  // Polling cada 4s mientras el viaje esté PENDING o IN_PROGRESS
  useEffect(() => {
    if (!id || !trip) return;
    if (trip.status !== "PENDING" && trip.status !== "IN_PROGRESS") return;

    const interval = setInterval(() => {
      getTripById(Number(id)).then(setTrip);
    }, 4000);

    return () => clearInterval(interval);
  }, [id, trip]);

  async function handleRate(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    setError("");
    try {
      const updated = await rateTrip(trip.id, rating, comment || undefined);
      setTrip(updated);
    } catch {
      setError("No se pudo enviar la calificación.");
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
        <button onClick={() => navigate("/passenger")} className="text-blue-400 hover:underline mb-4 block">
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

        {/* Calificación: solo si está COMPLETED y aún sin rating */}
        {trip.status === "COMPLETED" && trip.passengerRating == null && (
          <form onSubmit={handleRate} className="mt-6 bg-gray-800 p-6 rounded flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Califica tu viaje</h2>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl ${star <= rating ? "text-yellow-400" : "text-gray-600"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white text-sm">Comentario (opcional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="p-2 rounded bg-white text-black"
                rows={3}
              />
            </div>
            <Button type="submit">Enviar calificación</Button>
          </form>
        )}

        {/* Resumen de calificación ya enviada */}
        {trip.passengerRating != null && (
          <div className="mt-6 bg-gray-800 p-6 rounded">
            <p className="text-sm text-gray-400">Tu calificación</p>
            <p className="font-medium text-yellow-400">
              {trip.passengerRating} ★
              {trip.ratingComment ? ` — "${trip.ratingComment}"` : ""}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Button variant="secondary" onClick={() => navigate("/passenger")}>
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TripDetail;
