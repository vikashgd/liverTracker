import { notFound } from "next/navigation";
import { ShareLinkLandingClient } from "./share-link-landing-client";

interface ShareLinkPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ShareLinkPage({ params }: ShareLinkPageProps) {
  const { token } = await params;

  // Validate token format (64 hex characters from 32 bytes)
  if (!token || token.length !== 64 || !/^[a-f0-9]{64}$/i.test(token)) {
    notFound();
  }

  return <ShareLinkLandingClient token={token} />;
}

export async function generateMetadata({ params }: ShareLinkPageProps) {
  return {
    title: "Medical Report - Secure Share",
    description: "Secure medical report sharing",
    robots: "noindex, nofollow", // Prevent search engine indexing
  };
}