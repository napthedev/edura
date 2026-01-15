"use client";

import { BookOpen, Play, Star, TrendingUp, Users } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import Link from "next/link";

const Hero = () => {
  const t = useTranslations("Hero");

  const HERO = {
    title: t("title"),
    subtitle: t("subtitle"),
    ctaText: t("ctaText"),
    stats: [
      { number: "50K+", label: t("stats.students") },
      { number: "200+", label: t("stats.teachers") },
      { number: "95%", label: t("stats.satisfaction") },
    ],
  };
  return (
    <section
      className="relative overflow-hidden bg-white py-14 lg:py-20"
      id="home"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white">
        <div className="absolute top-0 left-0 h-full w-full opacity-30">
          <div className="absolute top-20 left-10 h-20 w-20 rounded-full bg-blue-100 blur-xl" />
          <div className="absolute top-40 right-20 h-32 w-32 rounded-full bg-green-100 blur-xl" />
          <div className="absolute bottom-20 left-1/4 h-24 w-24 rounded-full bg-purple-100 blur-xl" />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            {/* <div className="inline-flex items-center rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-700 text-sm">
              <Star className="mr-2 h-4 w-4 fill-current text-yellow-500" />
              {t("trustedBadge")}
            </div> */}

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="font-bold text-3xl text-gray-900 leading-tight sm:text-4xl lg:text-5xl">
                {HERO.title}
              </h1>
              <p className="max-w-lg text-gray-600 text-xl leading-relaxed">
                {HERO.subtitle}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/signup">
                <Button
                  className="transform bg-primary px-8 py-4 font-semibold text-lg text-white transition-all duration-200 hover:scale-105 hover:bg-primary/80"
                  size="lg"
                >
                  {t("signUp")}
                </Button>
              </Link>
              <Button
                className="flex items-center border-2 border-gray-300 px-8 py-4 font-semibold text-gray-700 text-lg transition-all duration-200 hover:bg-gray-50"
                size="lg"
                variant="outline"
              >
                <Play className="mr-2 h-5 w-5" />
                {t("watchDemo")}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-8 pt-8">
              <div className="font-medium text-gray-500 text-sm">
                {t("trustedBy")}
              </div>
              <div className="flex items-center gap-6 opacity-60">
                {t
                  .raw("trustedSchools")
                  .map((school: string, index: number) => (
                    <div
                      key={index}
                      className="font-bold text-gray-400 text-lg"
                    >
                      {school}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Content - Stats & Visual */}
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {HERO.stats.map((stat) => (
                <div
                  className="hover:-translate-y-1 transform rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
                  key={stat.label}
                >
                  <div className="mb-2 font-bold text-3xl text-gray-900">
                    {stat.number}
                  </div>
                  <div className="font-medium text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Feature Highlights */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
              <h3 className="mb-6 font-semibold text-gray-900 text-xl">
                {t("whyChoose")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-700">
                    {t("completeManagement")}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-gray-700">
                    {t("aiContentBuilder")}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-700">
                    {t("personalizedTracking")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
