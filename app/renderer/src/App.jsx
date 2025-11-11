import AppRouter from "@/router/AppRouter";
import { usePreloadSFX } from "@/hooks/usePreloadSFX"; // 👈 importar hook

export default function App() {
    usePreloadSFX(); // 👈 precarga automática al iniciar la app
    return <AppRouter />;
}
