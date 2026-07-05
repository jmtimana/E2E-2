import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as loginService } from "../services/Auth";
import { getMe } from "../services/Users";
import { useAuth } from "../context/AuthContext";
import FormField from "../components/FormField";
import Button from "../components/Button";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await loginService({ email, password });
      login(data.token, null!);
      const user = await getMe();
      login(data.token, user);
      if (user.role === "DRIVER") {
        navigate("/driver");
      } else {
        navigate("/passenger");
      }
    } catch {
      setError("Email o contraseña incorrectos");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded flex flex-col gap-4 w-80">
        <h1 className="text-white text-xl font-bold text-center">Iniciar sesión</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <FormField label="Email" type="email" value={email} onChange={setEmail} required />
        <FormField label="Password" type="password" value={password} onChange={setPassword} required />
        <Button type="submit">Ingresar</Button>
        <Link to="/register" className="text-blue-400 text-sm text-center hover:underline">
          ¿No tienes cuenta? Regístrate
        </Link>
      </form>
    </div>
  );
}

export default Login;
