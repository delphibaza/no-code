import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/config/supabaseClient";
import { useNavigate } from "react-router";

const Login: React.FC = () => {
  const navigate = useNavigate();

  supabase.auth.onAuthStateChange((event, session) => {
    if (session) navigate("/");
  });

  return (
    <div style={{ maxWidth: "420px", margin: "auto", padding: "1rem" }}>
      <h1 className="w-full text-center text-2xl text-black">Login</h1>
      <Auth
        supabaseClient={supabase}
        providers={["google", "github"]}
        appearance={{ theme: ThemeSupa }}
        view="sign_in"
      />
    </div>
  );
};

export default Login;
