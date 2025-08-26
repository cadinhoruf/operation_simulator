import { Toaster } from "sonner";
import "./App.css";
import NovaVertePage from "./components/NovaVertePage";

function App() {
  return (
    <>
      <NovaVertePage />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </>
  );
}

export default App;
