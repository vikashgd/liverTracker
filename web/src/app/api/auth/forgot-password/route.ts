import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, generatePasswordResetUrl } from "@/lib/password-reset-utils-simple";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create password reset token
    const result = await createPasswordResetToken(email.toLowerCase().trim());

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create reset token" },
        { status: 500 }
      );
    }

    // If we have a token, it means the user exists and we should send an email
    if (result.token) {
      const resetUrl = generatePasswordResetUrl(result.token);
      
      // TODO: Send email with reset link
      // For now, we'll just log it (in production, integrate with your email service)
      console.log(`Password reset link for ${email}: ${resetUrl}`);
      
      // In a real application, you would send an email here:
      // await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json(
      { message: "If an account with that email exists, we've sent you a password reset link." },
      { status: 200 }
    );

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}