import type { TripStatus } from "../types/trips.type";

const colors: Record<TripStatus, string> = {
  PENDING: "bg-yellow-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
};

interface StatusBadgeProps {
  status: TripStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${colors[status]} text-white text-xs font-bold px-2 py-1 rounded`}>
      {status === "IN_PROGRESS" ? "IN PROGRESS" : status}
    </span>
  );
}

export default StatusBadge;
