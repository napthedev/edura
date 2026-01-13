"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  CheckCircle,
  Layers,
} from "lucide-react";
import type { Flashcard } from "@/lib/assignment-types";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface FlashcardViewerProps {
  cards: Flashcard[];
  onComplete: () => void;
  isSubmitting?: boolean;
}

export function FlashcardViewer({
  cards: initialCards,
  onComplete,
  isSubmitting,
}: FlashcardViewerProps) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const t = useTranslations("FlashcardAssignment");

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const progress = ((currentIndex + 1) / totalCards) * 100;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else if (currentIndex === totalCards - 1) {
      setIsCompleted(true);
    }
  }, [currentIndex, totalCards]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleShuffle = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    toast.success(t("shuffled"));
  }, [cards, t]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      }
    },
    [handleFlip, handleNext, handlePrevious]
  );

  if (totalCards === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{t("noCards")}</p>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold">{t("completed")}</h3>
          <p className="text-muted-foreground">{t("completedMessage")}</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("practiceAgain")}
            </Button>
            <Button onClick={onComplete} disabled={isSubmitting}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? t("markComplete") + "..." : t("markComplete")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {t("cardOf", { current: currentIndex + 1, total: totalCards })}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="cursor-pointer outline-none"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={t("clickToFlip")}
      >
        <div
          className="relative w-full min-h-[300px] transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front Side */}
          <Card
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8">
              <span className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {t("term")}
              </span>
              <p className="text-2xl font-medium text-center">
                {currentCard?.front}
              </p>
              <span className="text-xs text-muted-foreground mt-4">
                {t("clickToFlip")}
              </span>
            </CardContent>
          </Card>

          {/* Back Side */}
          <Card
            className="absolute inset-0 bg-primary/5"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8">
              <span className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {t("definition")}
              </span>
              <p className="text-2xl font-medium text-center">
                {currentCard?.back}
              </p>
              <span className="text-xs text-muted-foreground mt-4">
                {t("clickToFlip")}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t("previous")}
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4 mr-2" />
            {t("shuffle")}
          </Button>
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("restart")}
          </Button>
        </div>

        <Button onClick={handleNext}>
          {currentIndex === totalCards - 1 ? (
            <>
              {t("markComplete")}
              <CheckCircle className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              {t("next")}
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
