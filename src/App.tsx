import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PassengerDashboard from "./pages/PassengerDashboard";
import RequestTrip from "./pages/RequestTrip";
import TripDetail from "./pages/TripDetail";
import History from "./pages/History";
import DriverDashboard from "./pages/DriverDashboard";
import DriverTripDetail from "./pages/DriverTripDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/passenger" element={<PassengerDashboard />} />
      <Route path="/passenger/request" element={<RequestTrip />} />
      <Route path="/trips/:id" element={<TripDetail />} />
      <Route path="/driver" element={<DriverDashboard />} />
      <Route path="/driver/trips/:id" element={<DriverTripDetail />} />
      <Route path="/history" element={<History />} />
    </Routes>
  );
}

export default App;
