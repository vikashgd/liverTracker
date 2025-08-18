import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";
import SignInForm from "./signin-form";

export default async function SignIn() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to LiverTrack
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Track your liver health with confidence
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
