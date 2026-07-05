# Cheat Sheet DBP — Plantillas genéricas para copiar y adaptar

Comparando los 2 exámenes que tienes (Sparky The Horizon / SparkyRoll), el patrón
es SIEMPRE el mismo: Auth (login/register) + una lista pública (GET) + una acción
protegida (POST/DELETE con token) + a veces una segunda acción protegida parecida
(favoritos + historial). Este documento es la plantilla genérica de TODO eso.

**Cómo usar esto en el examen:** copia el bloque, y solo cambia las partes en
`<ÁNGULOS>` por los nombres reales del examen que te toque (nombre de la entidad,
nombre de los campos, nombre de la ruta). El 90% del código no cambia nunca.

---

## 0. Setup inicial (copiar tal cual, sin pensar)

```bash
npm create vite@latest <nombre-proyecto> -- --template react-ts
cd <nombre-proyecto>
npm install
npm install axios react-router-dom
npm install tailwindcss @tailwindcss/vite
```

**`vite.config.ts`** (reemplazar todo el archivo):
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**`src/index.css`** (reemplazar todo el contenido):
```css
@import "tailwindcss";
```

**Carpetas a crear dentro de `src/`:**
```
pages/       -> una por cada ruta del enunciado
services/    -> uno por cada "familia" de endpoints
types/       -> las interfaces, según los DTO de la doc de la API
context/     -> AuthContext (siempre necesario si hay login)
components/  -> piezas reutilizables (Button, FormField, Card, Navbar)
```

---

## 1. Types — plantilla genérica

Mira la tabla de la documentación de la API. Cada tabla de "Campo | Tipo | Descripción"
se convierte 1 a 1 en esto:

```ts
// src/types/<entidad>.types.ts

// Lo que devuelve el GET de listado (ej: /api/anime/list, /api/albums)
export interface <Entidad> {
  id: number;
  <campo1>: string;
  <campo2>: string;
  // ...copia cada fila de la tabla del README tal cual, con el tipo correcto
}

// Body que mandas para crear/agregar algo relacionado a esta entidad
export interface <Accion>Request {
  <entidad>Id: number; // OJO: revisa el nombre EXACTO del campo en el README
}
```

**Tipos de auth (copiar siempre igual, casi nunca cambia):**
```ts
// src/types/auth.types.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
}
```

**Tabla de conversión Tipo del README → TypeScript:**
| README dice | TypeScript |
|---|---|
| String | `string` |
| Long / Integer / Int | `number` |
| Boolean | `boolean` |
| Array / Lista de X | `X[]` |
| Campo que puede no venir | `campo?: tipo` |

---

## 2. `services/api.ts` — copiar tal cual siempre

```ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // el puerto casi siempre es 8080
});

// Interceptor: agrega el token automáticamente a TODAS las peticiones
// que salgan después de este punto. No hay que tocarlo nunca más.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 3. Servicios — las 4 fórmulas que cubren TODO

### GET simple (listado público, sin parámetros)
```ts
export async function get<Entidades>(): Promise<<Entidad>[]> {
  const response = await api.get<<Entidad>[]>("/<ruta>");
  return response.data;
}
```
Ejemplos reales: `getAlbums()` → `/albums`, `getAnimes()` → `/anime/list`.

### GET con parámetro dinámico en la URL
```ts
export async function get<Entidad>ById(id: number): Promise<<Entidad>[]> {
  const response = await api.get<<Entidad>[]>(`/<ruta>/${id}/<sub-ruta>`);
  return response.data;
}
```
Ejemplo real: `getSongsByAlbum(albumId)` → `` `/albums/${albumId}/songs` ``.
**OJO: backticks, no comillas normales, para que `${id}` se interpole.**

### POST protegido (crear / agregar algo — requiere estar logueado)
```ts
export async function add<Accion>(id: number): Promise<void> {
  await api.post("/<ruta>", { <campo>Id: id });
}
```
Ejemplo real: `addFavorite(songId)` → `POST /user/favorites`, body `{ songId }`.
Ejemplo real: `addToHistory(animeId, status)` → body `{ animeId, status }`
(cuando el body tiene más de un campo, agrégalos todos en el objeto).

### DELETE protegido (quitar algo — requiere estar logueado)
```ts
export async function remove<Accion>(id: number): Promise<void> {
  await api.delete("/<ruta>", { data: { <campo>Id: id } });
}
```
**OJO: en axios, el DELETE con body va dentro de `{ data: {...} }`, no como
segundo argumento normal como en POST.**

### POST/DELETE de autenticación (siempre igual, cambia poco)
```ts
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", data);
  return response.data;
}
```

---

## 4. `AuthContext.tsx` — copiar y solo ajustar qué guarda además del token

Este bloque casi nunca cambia. Si el examen tiene 2 listas protegidas sin GET
(ej. favoritos + historial), duplica el patrón de `favorites` para la segunda.

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import type { <Entidad> } from "../types/<entidad>.types";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  // Guardamos la lista completa (no solo ids) porque casi nunca hay
  // GET para "mis favoritos" o "mi historial" — hay que recordarla nosotros.
  favorites: <Entidad>[];
  addFavorite: (item: <Entidad>) => void;
  removeFavorite: (id: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [favorites, setFavorites] = useState<<Entidad>[]>([]);

  function login(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setFavorites([]);
  }

  function addFavorite(item: <Entidad>) {
    setFavorites((prev) => [...prev, item]);
  }

  function removeFavorite(id: number) {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  const value: AuthContextType = {
    token,
    isAuthenticated: token !== null,
    login,
    logout,
    favorites,
    addFavorite,
    removeFavorite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
}
```

**Si necesitas DOS listas independientes (ej. favoritos Y historial):**
copia y pega `favorites/addFavorite/removeFavorite` una segunda vez, cambiando
el nombre a `history/addHistoryItem/removeHistoryItem`. Es exactamente el
mismo patrón repetido, no hay truco nuevo.

**Si el historial tiene un campo extra (ej. `status: "viendo" | "visto"`):**
guarda objetos en vez de la entidad pura:
```tsx
interface HistoryItem {
  anime: Anime;
  status: "viendo" | "visto";
}
const [history, setHistory] = useState<HistoryItem[]>([]);

function upsertHistory(anime: Anime, status: "viendo" | "visto") {
  setHistory((prev) => {
    const exists = prev.find((h) => h.anime.id === anime.id);
    if (exists) {
      return prev.map((h) => (h.anime.id === anime.id ? { ...h, status } : h));
    }
    return [...prev, { anime, status }];
  });
}
```

---

## 5. `main.tsx` — copiar tal cual siempre

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
```

## 6. `App.tsx` — plantilla, agregar una `<Route>` por vista del enunciado

```tsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
// import <OtrasPaginas> from "./pages/<OtrasPaginas>";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* <Route path="/<ruta-del-enunciado>" element={<Pagina />} /> */}
    </Routes>
  );
}

export default App;
```

---

## 7. Componentes reutilizables (copiar a `components/`)

### `Button.tsx` — un botón con variantes de color

```tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "danger" | "secondary";
  disabled?: boolean;
}

function Button({ children, onClick, type = "button", variant = "primary", disabled }: ButtonProps) {
  const colors = {
    primary: "bg-blue-600 hover:bg-blue-700",
    danger: "bg-red-600 hover:bg-red-700",
    secondary: "bg-gray-700 hover:bg-gray-600",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${colors[variant]} text-white px-4 py-2 rounded disabled:bg-gray-500 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export default Button;
```
**Uso:** `<Button variant="danger" onClick={() => handleRemove(id)}>Quitar</Button>`

### `FormField.tsx` — label + input controlado, reutilizable en Login/Register

```tsx
interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function FormField({ label, type = "text", value, onChange, required }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white text-sm">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="p-2 rounded text-black"
      />
    </div>
  );
}

export default FormField;
```
**Uso:**
```tsx
<FormField label="Email" type="email" value={email} onChange={setEmail} required />
```

### `Card.tsx` — tarjeta genérica para listar cualquier entidad (álbum, anime, etc.)

```tsx
interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  selected?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode; // para meter botones (favorito, quitar, etc.)
}

function Card({ title, subtitle, imageUrl, selected, onClick, actions }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded cursor-pointer flex flex-col gap-2 ${
        selected ? "bg-blue-600" : "bg-gray-700"
      }`}
    >
      {imageUrl && <img src={imageUrl} alt={title} className="w-full h-32 object-cover rounded" />}
      <p className="font-semibold text-white">{title}</p>
      {subtitle && <p className="text-sm text-gray-300">{subtitle}</p>}
      {actions}
    </div>
  );
}

export default Card;
```
**Uso:**
```tsx
<Card
  title={anime.title}
  subtitle={anime.genre}
  imageUrl={anime.imageUrl}
  onClick={() => handleSelect(anime.id)}
  actions={<Button variant="primary" onClick={() => handleAddFavorite(anime)}>Agregar</Button>}
/>
```

### `Navbar.tsx` — barra de navegación simple (opcional, suma puntos de UX/diseño)

```tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 flex gap-4 items-center">
      <Link to="/" className="text-white font-bold">Inicio</Link>
      {isAuthenticated ? (
        <>
          {/* <Link to="/<ruta>" className="text-gray-300">Sección</Link> */}
          <button onClick={logout} className="text-red-400 ml-auto">Cerrar sesión</button>
        </>
      ) : (
        <>
          <Link to="/login" className="text-gray-300 ml-auto">Login</Link>
          <Link to="/register" className="text-gray-300">Registro</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;
```

---

## 8. Páginas — plantillas completas

### `pages/Home.tsx` — landing con 2 botones (casi nunca lo pide el enunciado, pero es fácil punto extra de UX)

```tsx
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold"><Nombre de la app></h1>
      <div className="flex gap-4">
        <Link to="/login" className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700">
          Iniciar sesión
        </Link>
        <Link to="/register" className="bg-gray-700 px-6 py-2 rounded hover:bg-gray-600">
          Registrarse
        </Link>
      </div>
    </div>
  );
}

export default Home;
```

### `pages/Login.tsx` — plantilla completa, usando `FormField` y `Button`

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginService } from "../services/authService";
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
      login(data.token);
      navigate("/<ruta-principal-tras-login>");
    } catch (err) {
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
      </form>
    </div>
  );
}

export default Login;
```

### `pages/Register.tsx` — mismo patrón + campo `name`

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as registerService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import FormField from "../components/FormField";
import Button from "../components/Button";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await registerService({ email, password, name });
      login(data.token);
      navigate("/<ruta-principal-tras-login>");
    } catch (err) {
      setError("No se pudo registrar. Revisa los datos.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded flex flex-col gap-4 w-80">
        <h1 className="text-white text-xl font-bold text-center">Registrarse</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <FormField label="Nombre" value={name} onChange={setName} required />
        <FormField label="Email" type="email" value={email} onChange={setEmail} required />
        <FormField label="Password" type="password" value={password} onChange={setPassword} required />
        <Button type="submit">Crear cuenta</Button>
      </form>
    </div>
  );
}

export default Register;
```

### `pages/<Lista>.tsx` — plantilla de listado público (álbumes, animes, productos, lo que sea)

```tsx
import { useEffect, useState } from "react";
import { get<Entidades> } from "../services/<entidad>Service";
import type { <Entidad> } from "../types/<entidad>.types";
import { addFavorite } from "../services/favoriteService";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";

function <Lista>() {
  const [items, setItems] = useState<<Entidad>[]>([]);
  const { favorites, addFavorite: addFavoriteToContext } = useAuth();

  useEffect(() => {
    async function cargarDatos() {
      const data = await get<Entidades>();
      setItems(data);
    }
    cargarDatos();
  }, []);

  async function handleAddFavorite(item: <Entidad>) {
    try {
      await addFavorite(item.id);
      addFavoriteToContext(item);
    } catch (err) {
      alert("Debes iniciar sesión para agregar favoritos");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4"><Título de la página></h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card
            key={item.id}
            title={item.<campoTitulo>}
            subtitle={item.<campoSecundario>}
            imageUrl={item.<campoImagen>}
            actions={
              <Button
                variant="primary"
                disabled={favorites.some((f) => f.id === item.id)}
                onClick={() => handleAddFavorite(item)}
              >
                {favorites.some((f) => f.id === item.id) ? "En favoritos" : "Agregar a favoritos"}
              </Button>
            }
          />
        ))}
      </div>
    </div>
  );
}

export default <Lista>;
```
**Nota**: `key={item.id}` va afuera de `<Card>`, no dentro — React necesita el
`key` directo en el elemento que retorna el `.map()`.

### `pages/Favorites.tsx` — plantilla de lista que vive en el Context (sin GET)

```tsx
import { removeFavorite } from "../services/favoriteService";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

function Favorites() {
  const { favorites, removeFavorite: removeFavoriteFromContext } = useAuth();

  async function handleRemove(id: number) {
    await removeFavorite(id);
    removeFavoriteFromContext(id);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Mis favoritos</h1>
      {favorites.length === 0 && <p className="text-gray-400">Aún no agregaste nada.</p>}
      <ul className="flex flex-col gap-2">
        {favorites.map((item) => (
          <li key={item.id} className="bg-gray-800 p-2 rounded flex justify-between items-center">
            <span>{item.<campoTitulo>}</span>
            <Button variant="danger" onClick={() => handleRemove(item.id)}>Quitar</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Favorites;
```

### `pages/History.tsx` — plantilla para historial con `status` (ej. "viendo"/"visto")

Esto aplica directo al examen de SparkyRoll (`POST /user/history` con `{animeId, status}`).

```tsx
import { useState } from "react";
import api from "../services/api"; // o crea historyService.ts con addToHistory/removeFromHistory
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

interface HistoryItem {
  id: number;
  title: string;
  status: "viendo" | "visto";
}

function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function handleSetStatus(id: number, title: string, status: "viendo" | "visto") {
    await api.post("/user/history", { animeId: id, status });
    setHistory((prev) => {
      const exists = prev.find((h) => h.id === id);
      if (exists) return prev.map((h) => (h.id === id ? { ...h, status } : h));
      return [...prev, { id, title, status }];
    });
  }

  async function handleRemove(id: number) {
    await api.delete("/user/history", { data: { animeId: id } });
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Mi historial</h1>
      <ul className="flex flex-col gap-2">
        {history.map((item) => (
          <li key={item.id} className="bg-gray-800 p-2 rounded flex justify-between items-center">
            <span>{item.title} — {item.status}</span>
            <div className="flex gap-2">
              <Button onClick={() => handleSetStatus(item.id, item.title, "viendo")}>Viendo</Button>
              <Button onClick={() => handleSetStatus(item.id, item.title, "visto")}>Visto</Button>
              <Button variant="danger" onClick={() => handleRemove(item.id)}>Quitar</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default History;
```
**Idea clave de este patrón**: como el backend no tiene GET de historial,
tienes que "marcar" un anime como viendo/visto directamente desde la página
de Animes (agregando un botón ahí también que llame `api.post("/user/history", ...)`),
y esta página `History.tsx` solo refleja lo que el Context/estado ya sabe.
Si el examen pide esto, lo más simple es agregar `history` y sus funciones al
mismo `AuthContext`, igual que hicimos con `favorites`.

---

## 9. Errores que ya cometiste una vez — checklist mental antes de entregar

- [ ] Backticks (` `` `) para interpolar `${variable}` en URLs, NUNCA comillas normales
- [ ] Componentes y tipos en `Mayúscula`; variables, funciones y archivos de servicio en `minúscula`
- [ ] `useState` se desestructura con corchetes `[valor, setValor]`, no paréntesis
- [ ] `async` nunca directo en `useEffect` → función interna + llamarla
- [ ] `onClick={() => fn(x)}` con flecha, nunca `onClick={fn(x)}`
- [ ] Revisar el nombre EXACTO de cada campo del body (`songId` vs `id`, `animeId` vs `id`)
- [ ] Un solo `export default` por archivo de página/componente
- [ ] `<li>` siempre dentro de `<ul>`/`<ol>`
- [ ] El `key={}` de un `.map()` va en el elemento que se repite, no adentro
- [ ] DELETE con body en axios: `api.delete(url, { data: {...} })`, no como segundo argumento suelto
- [ ] Revisar el puerto/baseURL del backend (`http://localhost:8080/api`) y que el backend esté corriendo en otra terminal

---

## 10. Orden a seguir en el examen (resumen de la guía anterior)

1. Setup + Tailwind (5-10 min)
2. Types según la doc de la API (10 min)
3. `services/api.ts` con interceptor (5 min)
4. Routing con páginas vacías, confirmar que navega (10 min)
5. Componentes reutilizables: `Button`, `FormField`, `Card` (10 min) — te ahorran tiempo en TODAS las páginas después
6. GET público más simple → primera pantalla con datos reales (15-20 min)
7. Login/Register + AuthContext (30-35 min)
8. Acciones protegidas (favoritos/historial) usando el Context (20-25 min)
9. Pulido Tailwind con lo que quede de tiempo
