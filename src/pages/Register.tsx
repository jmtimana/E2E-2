import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerService } from "../services/Auth";
import { getMe } from "../services/Users";
import { useAuth } from "../context/AuthContext";
import FormField from "../components/FormField";
import Button from "../components/Button";
import type { Role } from "../types/user.type";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PASSENGER");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await registerService({ firstName, lastName, email, password, role });
      login(data.token, null!);
      const user = await getMe();
      login(data.token, user);
      if (user.role === "DRIVER") {
        navigate("/driver");
      } else {
        navigate("/passenger");
      }
    } catch {
      setError("No se pudo registrar. Revisa los datos.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded flex flex-col gap-4 w-80">
        <h1 className="text-white text-xl font-bold text-center">Registrarse</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <FormField label="Nombre" value={firstName} onChange={setFirstName} required />
        <FormField label="Apellido" value={lastName} onChange={setLastName} required />
        <FormField label="Email" type="email" value={email} onChange={setEmail} required />
        <FormField label="Password" type="password" value={password} onChange={setPassword} required />
        <div className="flex flex-col gap-1">
          <label className="text-white text-sm">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="p-2 rounded text-black"
            required
          >
            <option value="PASSENGER">Pasajero</option>
            <option value="DRIVER">Conductor</option>
          </select>
        </div>
        <Button type="submit">Crear cuenta</Button>
        <Link to="/login" className="text-blue-400 text-sm text-center hover:underline">
          Ya tienes cuenta? Inicia sesion
        </Link>
      </form>
    </div>
  );
}

export default Register;
