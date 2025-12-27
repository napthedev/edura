"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Users, Zap, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Pricing() {
  const t = useTranslations("Pricing");

  const features = t.raw("features") as string[];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Single Pricing Card */}
        <Card className="relative border-2 border-black shadow-xl max-w-2xl mx-auto">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900">
              {t("planName")}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2 text-lg">
              {t("planDescription")}
            </CardDescription>

            {/* Pricing Structure */}
            <div className="mt-8 space-y-4">
              {/* Free Tier */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-green-600" />
                  <span className="text-2xl font-bold text-green-700">
                    {t("freeTier.title")}
                  </span>
                </div>
                <p className="text-green-600 font-medium">
                  {t("freeTier.description")}
                </p>
              </div>

              {/* Paid Tier */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    5,000₫
                  </span>
                  <span className="text-gray-500 text-lg">
                    {t("paidTier.perStudent")}
                  </span>
                </div>
                <p className="text-gray-600">{t("paidTier.description")}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <h4 className="font-semibold text-gray-900 mb-4 text-center">
              {t("includedFeatures")}
            </h4>
            <ul className="space-y-4 grid md:grid-cols-2 gap-x-6">
              {features.map((feature: string, index: number) => (
                <li key={index} className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Link href="/contact" className="w-full">
              <Button className="w-full py-6 text-lg font-semibold bg-primary text-white hover:bg-primary/80">
                <MessageCircle className="w-5 h-5 mr-2" />
                {t("contactCta")}
              </Button>
            </Link>
            <p className="text-sm text-gray-500 text-center">
              {t("contactNote")}
            </p>
          </CardFooter>
        </Card>

        {/* Trust Section */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center mt-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t("guarantee.title")}
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t("guarantee.description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
