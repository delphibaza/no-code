import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router"
import "./index.css"
import App from "./App"
import AuthWrapper from "./components/auth/AuthWrapper"
import Login from "./components/auth/Login"
import Signup from "./components/auth/Signup"

ReactDOM.createRoot(document.getElementById("root")!).render(<App />)
