import { BookOpen, Play, Star, TrendingUp, Users } from "lucide-react";
import { mockData } from "../../lib/mock";
import { Button } from "../ui/button";

const Hero = () => {
  const { hero } = mockData;

  return (
    <section
      className="relative overflow-hidden bg-white py-20 lg:py-28"
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
            <div className="inline-flex items-center rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-700 text-sm">
              <Star className="mr-2 h-4 w-4 fill-current text-yellow-500" />
              Trusted by 50,000+ families worldwide
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="font-bold text-4xl text-gray-900 leading-tight sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="max-w-lg text-gray-600 text-xl leading-relaxed">
                {hero.subtitle}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                className="transform bg-black px-8 py-4 font-semibold text-lg text-white transition-all duration-200 hover:scale-105 hover:bg-gray-800"
                size="lg"
              >
                {hero.ctaText}
              </Button>
              <Button
                className="flex items-center border-2 border-gray-300 px-8 py-4 font-semibold text-gray-700 text-lg transition-all duration-200 hover:bg-gray-50"
                size="lg"
                variant="outline"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-8 pt-8">
              <div className="font-medium text-gray-500 text-sm">
                Trusted by leading schools:
              </div>
              <div className="flex items-center gap-6 opacity-60">
                <div className="font-bold text-gray-400 text-lg">
                  ABC School
                </div>
                <div className="font-bold text-gray-400 text-lg">
                  Learning Academy
                </div>
                <div className="font-bold text-gray-400 text-lg">
                  Bright Future
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Stats & Visual */}
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {hero.stats.map((stat) => (
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
                Why Parents Choose Edura
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-700">
                    Expert certified teachers
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-700">
                    Curriculum-aligned content
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-700">
                    Personalized learning paths
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
