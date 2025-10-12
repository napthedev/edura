"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const t = useTranslations("Pricing");

  const PRICING_PLANS = [
    {
      id: 1,
      name: t("plans.basic.name"),
      price: "$19",
      period: t("perMonth"),
      description: t("plans.basic.description"),
      features: t.raw("plans.basic.features"),
      popular: false,
      ctaText: t("plans.basic.cta"),
    },
    {
      id: 2,
      name: t("plans.standard.name"),
      price: "$39",
      period: t("perMonth"),
      description: t("plans.standard.description"),
      features: t.raw("plans.standard.features"),
      popular: true,
      ctaText: t("plans.standard.cta"),
    },
    {
      id: 3,
      name: t("plans.premium.name"),
      price: "$69",
      period: t("perMonth"),
      description: t("plans.premium.description"),
      features: t.raw("plans.premium.features"),
      popular: false,
      ctaText: t("plans.premium.cta"),
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t("subtitle")}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t("monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full font-medium transition-all relative ${
                billingCycle === "yearly"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t("yearly")}
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1">
                {t("save")}
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {PRICING_PLANS.map((plan) => {
            const yearlyPrice = Math.round(
              parseInt(plan.price.replace("$", "")) * 0.8
            );
            const displayPrice =
              billingCycle === "yearly" ? `$${yearlyPrice}` : plan.price;

            return (
              <Card
                key={plan.id}
                className={`relative hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  plan.popular
                    ? "border-2 border-black shadow-lg scale-105"
                    : "border border-gray-200"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-black text-white px-6 py-2 text-sm font-semibold">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      {t("mostPopular")}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>

                  {/* Pricing */}
                  <div className="mt-6">
                    <div className="flex items-center justify-center">
                      <span className="text-5xl font-bold text-gray-900">
                        {displayPrice}
                      </span>
                      <span className="text-gray-500 ml-2">
                        /
                        {billingCycle === "yearly"
                          ? t("perYear")
                          : t("perMonth")}
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="text-sm text-green-600 font-medium mt-2">
                        {t("savePerYear", {
                          amount: (
                            parseInt(plan.price.replace("$", "")) * 12 -
                            yearlyPrice * 12
                          ).toString(),
                        })}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full py-3 font-semibold transition-all duration-200 ${
                      plan.popular
                        ? "bg-black text-white hover:bg-gray-800"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    {plan.ctaText}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Money Back Guarantee */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
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

        {/* FAQ Teaser */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">{t("faq.question")}</p>
          <Button variant="outline" className="border-gray-300">
            {t("faq.cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
