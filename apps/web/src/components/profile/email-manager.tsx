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
import { Plus, Trash2, Star, Mail } from "lucide-react";

type Email = {
  emailId: string;
  email: string;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: Date | string;
};

interface EmailManagerProps {
  emails: Email[];
}

export default function EmailManager({ emails }: EmailManagerProps) {
  const t = useTranslations("Profile");
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return await trpcClient.profile.addEmail.mutate({ email });
    },
    onSuccess: () => {
      toast.success(t("emails.addSuccess"));
      setNewEmail("");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("emails.addError"));
    },
  });

  const removeEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return await trpcClient.profile.removeEmail.mutate({ emailId });
    },
    onSuccess: () => {
      toast.success(t("emails.removeSuccess"));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("emails.removeError"));
    },
  });

  const setPrimaryEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return await trpcClient.profile.setPrimaryEmail.mutate({ emailId });
    },
    onSuccess: () => {
      toast.success(t("emails.setPrimarySuccess"));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("emails.setPrimaryError"));
    },
  });

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim()) {
      addEmailMutation.mutate(newEmail.trim());
    }
  };

  return (
    <Card className="shadow-sm border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t("emails.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing emails list */}
        <div className="space-y-2">
          {emails.map((email) => (
            <div
              key={email.emailId}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{email.email}</span>
                {email.isPrimary && (
                  <Badge variant="default" className="text-xs">
                    {t("emails.primary")}
                  </Badge>
                )}
                {email.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    {t("emails.verified")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!email.isPrimary && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPrimaryEmailMutation.mutate(email.emailId)
                      }
                      disabled={setPrimaryEmailMutation.isPending}
                      title={t("emails.setPrimary")}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmailMutation.mutate(email.emailId)}
                      disabled={removeEmailMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      title={t("emails.remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new email form */}
        {isAdding ? (
          <form onSubmit={handleAddEmail} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="newEmail">{t("emails.newEmail")}</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t("emails.placeholder")}
              />
            </div>
            <Button
              type="submit"
              disabled={addEmailMutation.isPending || !newEmail.trim()}
            >
              {addEmailMutation.isPending
                ? t("common.adding")
                : t("common.add")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewEmail("");
              }}
            >
              {t("common.cancel")}
            </Button>
          </form>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("emails.addEmail")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
