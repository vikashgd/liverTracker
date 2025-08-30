import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/account-management";

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { password, confirmDelete } = await request.json();

    if (!confirmDelete) {
      return NextResponse.json(
        { error: "Account deletion must be confirmed" },
        { status: 400 }
      );
    }

    const result = await deleteUserAccount(userId, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}