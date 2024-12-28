import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Label } from "@/components/ui/Label"
import { Button } from "../ui/button"

const Login = () => {
  const handleSubmit = () => {}
  return (
    <>
      {/* <Card className="max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" required />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card> */}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5">
          <Input
            id="email"
            type="email"
            placeholder="email"
            required
            className="bg-gray-100 border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md p-2 w-80"
          />

          <Input
            id="password"
            type="password"
            placeholder="password"
            required
            className="bg-gray-100 border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md p-2"
          />
        </div>

        <Button
          type="submit"
          className="bg-[#512dae] text-white border border-transparent rounded-md cursor-pointer w-full hover:bg-[#4a1e99] hover:text-white"
        >
          Sign In
        </Button>
      </div>
    </>
  )
}

export default Login
