"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Import, Eye, Layers } from "lucide-react";
import type { Flashcard } from "@/lib/assignment-types";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkImportDialogProps {
  onImport: (cards: Flashcard[]) => void;
  startIndex: number;
}

export function BulkImportDialog({
  onImport,
  startIndex,
}: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const t = useTranslations("FlashcardAssignment");

  // Parse the input text and detect format
  const parsedCards = useMemo(() => {
    if (!inputText.trim()) return [];

    const lines = inputText.split("\n").filter((line) => line.trim());
    const cards: Flashcard[] = [];

    // Check if it's tab-delimited format
    const hasTabDelimited = lines.some((line) => line.includes("\t"));

    if (hasTabDelimited) {
      // Tab-delimited format: term\tdefinition
      lines.forEach((line, idx) => {
        const parts = line.split("\t");
        if (parts.length >= 2) {
          const front = parts[0]?.trim() || "";
          const back = parts.slice(1).join("\t").trim(); // Join remaining parts in case of multiple tabs
          if (front && back) {
            cards.push({
              id: crypto.randomUUID(),
              index: startIndex + cards.length,
              front,
              back,
            });
          }
        }
      });
    } else {
      // Line-pair format: term on one line, definition on next
      for (let i = 0; i < lines.length; i += 2) {
        const front = lines[i]?.trim() || "";
        const back = lines[i + 1]?.trim() || "";
        if (front && back) {
          cards.push({
            id: crypto.randomUUID(),
            index: startIndex + cards.length,
            front,
            back,
          });
        }
      }
    }

    return cards;
  }, [inputText, startIndex]);

  const handleImport = () => {
    if (parsedCards.length > 0) {
      onImport(parsedCards);
      setInputText("");
      setShowPreview(false);
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setInputText("");
    setShowPreview(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Import className="h-4 w-4 mr-2" />
          {t("importCards")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {t("importCards")}
          </DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {!showPreview ? (
            <div className="space-y-2">
              <Label htmlFor="import-text">{t("cards")}</Label>
              <Textarea
                id="import-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t("importPlaceholder")}
                className="min-h-[200px] font-mono text-sm"
              />
              {inputText.trim() && (
                <p className="text-sm text-muted-foreground">
                  {parsedCards.length > 0
                    ? `${parsedCards.length} ${t("cardsToImport")}`
                    : t("noCardsDetected")}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("previewCards")}</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {parsedCards.length > 0 ? (
                  <div className="space-y-3">
                    {parsedCards.map((card, index) => (
                      <div
                        key={card.id}
                        className="p-3 bg-muted rounded-lg space-y-1"
                      >
                        <div className="text-xs text-muted-foreground">
                          {t("card")} {index + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">
                              {t("term")}:
                            </span>{" "}
                            {card.front}
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">
                              {t("definition")}:
                            </span>{" "}
                            {card.back}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t("noCardsDetected")}
                  </p>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          {!showPreview ? (
            <Button
              variant="secondary"
              onClick={() => setShowPreview(true)}
              disabled={parsedCards.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t("preview")}
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowPreview(false)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedCards.length === 0}
              >
                <Import className="h-4 w-4 mr-2" />
                {t("import")} ({parsedCards.length})
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
