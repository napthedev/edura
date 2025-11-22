import DemoVideoSection from "@/components/landing/demo-video";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import Pricing from "@/components/landing/pricing";
import Testimonials from "@/components/landing/testimonials";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";

export default async function Home() {
  // Server-side check: if user already has a session (via cookies/headers), redirect to dashboard
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <>
      <Header />
      <Hero />
      <DemoVideoSection />
      <Features />
      <Testimonials />
      <Pricing />
      <Footer />
    </>
  );
}
