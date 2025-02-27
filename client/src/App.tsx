import { BrowserRouter, Route, Routes } from "react-router";
import { ThemeProvider } from "./components/ui/theme-provider";
import Home from "./pages/Home";
import ProjectInfo from "./pages/ProjectInfo";
import MainLayout from "./components/MainLayout";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/project/:projectId" element={<ProjectInfo />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

