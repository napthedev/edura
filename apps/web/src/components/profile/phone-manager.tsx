"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Star, Phone } from "lucide-react";

type PhoneNumber = {
  phoneId: string;
  phoneNumber: string;
  isPrimary: boolean;
  label: string | null;
  createdAt: Date | string;
};

interface PhoneManagerProps {
  phones: PhoneNumber[];
}

export default function PhoneManager({ phones }: PhoneManagerProps) {
  const t = useTranslations("Profile");
  const queryClient = useQueryClient();
  const [newPhone, setNewPhone] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addPhoneMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; label?: string }) => {
      return await trpcClient.profile.addPhone.mutate(data);
    },
    onSuccess: () => {
      toast.success(t("phones.addSuccess"));
      setNewPhone("");
      setNewLabel("");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("phones.addError"));
    },
  });

  const removePhoneMutation = useMutation({
    mutationFn: async (phoneId: string) => {
      return await trpcClient.profile.removePhone.mutate({ phoneId });
    },
    onSuccess: () => {
      toast.success(t("phones.removeSuccess"));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("phones.removeError"));
    },
  });

  const setPrimaryPhoneMutation = useMutation({
    mutationFn: async (phoneId: string) => {
      return await trpcClient.profile.setPrimaryPhone.mutate({ phoneId });
    },
    onSuccess: () => {
      toast.success(t("phones.setPrimarySuccess"));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("phones.setPrimaryError"));
    },
  });

  const handleAddPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhone.trim()) {
      addPhoneMutation.mutate({
        phoneNumber: newPhone.trim(),
        label: newLabel.trim() || undefined,
      });
    }
  };

  return (
    <Card className="shadow-sm border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          {t("phones.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing phones list */}
        <div className="space-y-2">
          {phones.map((phone) => (
            <div
              key={phone.phoneId}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{phone.phoneNumber}</span>
                {phone.label && (
                  <Badge variant="outline" className="text-xs">
                    {phone.label}
                  </Badge>
                )}
                {phone.isPrimary && (
                  <Badge variant="default" className="text-xs">
                    {t("phones.primary")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!phone.isPrimary && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPrimaryPhoneMutation.mutate(phone.phoneId)
                      }
                      disabled={setPrimaryPhoneMutation.isPending}
                      title={t("phones.setPrimary")}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhoneMutation.mutate(phone.phoneId)}
                      disabled={removePhoneMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      title={t("phones.remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new phone form */}
        {isAdding ? (
          <form onSubmit={handleAddPhone} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="newPhone">{t("phones.phoneNumber")}</Label>
                <Input
                  id="newPhone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder={t("phones.phonePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLabel">{t("phones.label")}</Label>
                <Input
                  id="newLabel"
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={t("phones.labelPlaceholder")}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={addPhoneMutation.isPending || !newPhone.trim()}
              >
                {addPhoneMutation.isPending
                  ? t("common.adding")
                  : t("common.add")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewPhone("");
                  setNewLabel("");
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("phones.addPhone")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
