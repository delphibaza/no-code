import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router";
import MainLayout from "./components/MainLayout";
import { ThemeProvider } from "./components/ui/theme-provider";
import Home from "./pages/Home";
import ProjectInfo from "./pages/ProjectInfo";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster />
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/project/:projectId" element={<ProjectInfo />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
