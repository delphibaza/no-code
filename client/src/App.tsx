import { BrowserRouter, Route, Routes } from "react-router";
import AuthWrapper from "./components/auth/AuthWrapper";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
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
          <Route element={<AuthWrapper />}>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

