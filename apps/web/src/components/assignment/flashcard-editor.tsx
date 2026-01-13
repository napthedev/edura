"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Layers } from "lucide-react";
import type { Flashcard } from "@/lib/assignment-types";
import { useTranslations } from "next-intl";

interface FlashcardEditorProps {
  card: Flashcard;
  onUpdate: (card: Flashcard) => void;
  onDelete: () => void;
  fieldErrors?: Record<string, boolean>;
}

export function FlashcardEditor({
  card,
  onUpdate,
  onDelete,
  fieldErrors = {},
}: FlashcardEditorProps) {
  const [localCard, setLocalCard] = useState<Flashcard>(card);
  const t = useTranslations("FlashcardAssignment");

  useEffect(() => {
    setLocalCard(card);
  }, [card]);

  const updateCard = (updates: Partial<Flashcard>) => {
    const newCard = { ...localCard, ...updates };
    setLocalCard(newCard);
    onUpdate(newCard);
  };

  const getFieldError = (fieldKey: string) => {
    return fieldErrors[fieldKey] || false;
  };

  const getInputClassName = (fieldKey: string) => {
    return getFieldError(fieldKey)
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {t("card")} {card.index}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`front-${card.id}`}>{t("front")}</Label>
            <Input
              id={`front-${card.id}`}
              value={localCard.front}
              onChange={(e) => updateCard({ front: e.target.value })}
              placeholder={t("frontPlaceholder")}
              className={getInputClassName(`card-${card.id}-front`)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`back-${card.id}`}>{t("back")}</Label>
            <Input
              id={`back-${card.id}`}
              value={localCard.back}
              onChange={(e) => updateCard({ back: e.target.value })}
              placeholder={t("backPlaceholder")}
              className={getInputClassName(`card-${card.id}-back`)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
