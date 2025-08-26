import { Toaster } from "sonner";
import NovaVertePage from "./components/NovaVertePage";
import "./index.css";

function App() {
  return (
    <>
      <NovaVertePage />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </>
  );
}

export default App;
