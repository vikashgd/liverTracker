import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";
import SignUpForm from "./signup-form";
import MobileAuthWrapper from "@/components/auth/mobile-auth-wrapper";
import MobileSignUpForm from "@/components/auth/mobile-sign-up-form";

export default async function SignUp({ 
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
        title="Join LiverTrack"
        subtitle="Create your account to start tracking your liver health"
        footerText="Already have an account?"
        footerLink={{ text: "Sign in here", href: "/auth/signin?mobile=true" }}
      >
        <MobileSignUpForm />
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
                Create your LiverTrack account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Start tracking your liver health today
              </p>
            </div>
            <SignUpForm />
          </div>
        </main>
      </div>

      {/* Mobile Version */}
      <div className="block sm:hidden">
        <MobileAuthWrapper
          title="Join LiverTrack"
          subtitle="Create your account to start tracking your liver health"
          footerText="Already have an account?"
          footerLink={{ text: "Sign in here", href: "/auth/signin" }}
        >
          <MobileSignUpForm />
        </MobileAuthWrapper>
      </div>
    </>
  );
}