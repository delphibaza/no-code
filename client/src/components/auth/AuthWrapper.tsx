import { Link, Outlet, useLocation } from "react-router"
import { Button } from "../ui/button"

const AuthWrapper = () => {
  const location = useLocation()

  const buttonText = location.pathname === "/login" ? "Signup" : "Signin"

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex w-full h-full  bg-white ">
        <div className="bg-custom-gradient rounded-r-[220px] w-1/2 flex justify-center items-center">
          <div className="flex flex-col gap-8 items-center">
            <p className="text-white text-7xl">Welcome{buttonText == "Signin" && " Back"}!</p>
            <Button
              variant="outline"
              asChild
              className="bg-transparent border-white text-white hover:bg-white hover:text-black w-40 flex items-center justify-center"
            >
              <Link to={location.pathname === "/login" ? "/signup" : "/login"}>{buttonText}</Link>
            </Button>
          </div>
        </div>
        <div className="w-1/2 flex justify-center items-center">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthWrapper
