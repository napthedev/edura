"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Layers } from "lucide-react";
import type { Flashcard } from "@/lib/assignment-types";
import { useTranslations } from "next-intl";

interface AddFlashcardProps {
  onAdd: (card: Flashcard) => void;
  nextIndex: number;
}

export function AddFlashcard({ onAdd, nextIndex }: AddFlashcardProps) {
  const t = useTranslations("FlashcardAssignment");

  const handleAddCard = () => {
    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      index: nextIndex,
      front: "",
      back: "",
    };
    onAdd(newCard);
  };

  return (
    <Button
      variant="outline"
      onClick={handleAddCard}
      className="w-full border-dashed"
    >
      <Plus className="h-4 w-4 mr-2" />
      {t("addCard")}
    </Button>
  );
}
