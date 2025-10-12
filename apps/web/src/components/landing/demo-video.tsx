"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { useState } from "react";

export default function DemoVideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section
      id="demo"
      className="relative bg-white py-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <Badge
            variant="secondary"
            className="text-sm font-medium px-4 py-1.5"
          >
            See it in action
          </Badge>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
            Everything you need to run your
            <span className="block text-primary mt-2">tutoring business</span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            Watch how Edura streamlines scheduling, payments, and student
            management—all in one powerful platform built specifically for
            private tutors.
          </p>
        </div>

        {/* Video Container */}
        <div className="mb-20">
          <div className="relative max-w-5xl mx-auto">
            {/* Video wrapper with glow effect */}
            <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-50" />

              {/* Video placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50">
                {!isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Play button with pulse animation */}
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                      <Button
                        size="lg"
                        onClick={() => setIsPlaying(true)}
                        className="relative h-20 w-20 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                      >
                        <Play className="h-8 w-8 ml-1" fill="currentColor" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium">
                          Demo video would play here
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video overlay with timestamp */}
                {!isPlaying && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className="bg-background/80 backdrop-blur-sm"
                    >
                      2:30 min
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-background/80 backdrop-blur-sm"
                    >
                      Product Demo
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
