import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";
import SignInForm from "./signin-form";
import MobileAuthWrapper from "@/components/auth/mobile-auth-wrapper";
import MobileSignInForm from "@/components/auth/mobile-sign-in-form";

export default async function SignIn({ 
  searchParams 
}: { 
  searchParams: Promise<{ mobile?: string }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }

  // Await searchParams in Next.js 15
  const params = await searchParams;
  
  // Check if mobile version is explicitly requested
  const forceMobile = params.mobile === 'true';
  
  if (forceMobile) {
    return (
      <MobileAuthWrapper
        title="Welcome back"
        subtitle="Sign in to your LiverTrack account"
        footerText="Don't have an account?"
        footerLink={{ text: "Sign up here", href: "/auth/signup?mobile=true" }}
      >
        <MobileSignInForm />
      </MobileAuthWrapper>
    );
  }

  return (
    <>
      {/* Desktop/Default Version */}
      <div className="hidden sm:block">
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
      </div>

      {/* Mobile Version */}
      <div className="block sm:hidden">
        <MobileAuthWrapper
          title="Welcome back"
          subtitle="Sign in to your LiverTrack account"
          footerText="Don't have an account?"
          footerLink={{ text: "Sign up here", href: "/auth/signup" }}
        >
          <MobileSignInForm />
        </MobileAuthWrapper>
      </div>
    </>
  );
}
