"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Testimonials() {
  const t = useTranslations("Testimonials");

  const TESTIMONIALS = [
    {
      id: 1,
      name: t("students.emma.name"),
      grade: t("students.emma.grade"),
      text: t("students.emma.text"),
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
    },
    {
      id: 2,
      name: t("students.michael.name"),
      grade: t("students.michael.grade"),
      text: t("students.michael.text"),
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    },
    {
      id: 3,
      name: t("students.sophia.name"),
      grade: t("students.sophia.grade"),
      text: t("students.sophia.text"),
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    },
  ];

  const PARENT_TESTIMONIALS = [
    {
      id: 1,
      name: t("parents.jennifer.name"),
      relation: t("parents.jennifer.relation"),
      text: t("parents.jennifer.text"),
      rating: 5,
    },
    {
      id: 2,
      name: t("parents.robert.name"),
      relation: t("parents.robert.relation"),
      text: t("parents.robert.text"),
      rating: 5,
    },
  ];
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Student Testimonials */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            {t("studentVoices")}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="bg-gray-50 border-2 border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <Quote className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-500 fill-current"
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </p>

                  {/* Student Info */}
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                      />
                      <AvatarFallback className="bg-gray-300 text-gray-700">
                        {testimonial.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.grade}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Parent Testimonials */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            {t("parentFeedback")}
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {PARENT_TESTIMONIALS.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="bg-black text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <CardContent className="p-8">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <Quote className="w-10 h-10 text-gray-400" />
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-500 fill-current"
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-100 mb-6 text-lg leading-relaxed">
                    "{testimonial.text}"
                  </p>

                  {/* Parent Info */}
                  <div>
                    <div className="font-semibold text-white text-lg">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-300">{testimonial.relation}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-8 py-4 bg-green-50 border-2 border-green-200 rounded-full">
            <Star className="w-6 h-6 text-green-600 fill-current mr-3" />
            <span className="text-green-800 font-semibold text-lg">
              {t("trustBadge")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
