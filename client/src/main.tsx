import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router"
import "./index.css"
import App from "./App"
import AuthWrapper from "./components/auth/AuthWrapper"
import Login from "./components/auth/Login"
import Register from "./components/auth/Register"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        {/* Authentication Routes */}
        <Route element={<AuthWrapper />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
