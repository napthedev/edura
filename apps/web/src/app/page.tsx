"use client";

import DemoVideoSection from "@/components/landing/demo-video";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import Pricing from "@/components/landing/pricing";
import Testimonials from "@/components/landing/testimonials";

export default function Home() {
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
