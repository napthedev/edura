"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  FolderOpen,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

export default function DemoVideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Track progress, attendance, and student profiles",
      colorClasses:
        "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-indigo-50",
    },
    {
      icon: ClipboardList,
      title: "Assignment Creation",
      description: "Create and distribute assignments effortlessly",
      colorClasses:
        "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-emerald-50",
    },
    {
      icon: MessageSquare,
      title: "Parent Communication",
      description: "Keep parents informed with automated updates",
      colorClasses:
        "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-rose-50",
    },
    {
      icon: Calendar,
      title: "Schedule Management",
      description: "Automated booking and calendar sync",
      colorClasses:
        "bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-sky-50",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Insights and reports on student progress",
      colorClasses:
        "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-amber-50",
    },
    {
      icon: FolderOpen,
      title: "Resource Library",
      description: "Organize and share teaching materials",
      colorClasses:
        "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-violet-50",
    },
  ];

  return (
    <section className="relative bg-background py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        {/* Title and description */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            Check out all the amazing features
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed specifically for private tutors
          </p>
        </div>
        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-xl border border-border bg-card hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div
                className={`mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.colorClasses} transition-colors duration-300`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
