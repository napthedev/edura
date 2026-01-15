"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Building2,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";

export default function ContactPage() {
  const t = useTranslations("SignUp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone") || undefined,
        centerName: formData.get("centerName"),
        studentCount: formData.get("studentCount")
          ? parseInt(formData.get("studentCount") as string)
          : undefined,
        message: formData.get("message") || undefined,
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to submit contact form. Please try again."
        );
      }

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        toast.success(
          "Form submitted successfully! Check your email for account details."
        );
      } else {
        throw new Error(result.error || "An error occurred");
      }
    } catch (err: any) {
      console.error("Contact form error:", err);
      const errorMsg =
        err.message || "Failed to submit contact form. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t("success.title")}</CardTitle>
            <CardDescription className="text-base">
              {t("success.message")}
            </CardDescription>
            <div className="mt-4 p-3 bg-primary/10 border border-blue-100 rounded-lg flex gap-3 items-center justify-center">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-blue-800">{t("success.spamNote")}</p>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                {t("success.backToHome")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="font-bold text-2xl text-black">
              Edura
            </Link>
            <Link href="/login">
              <Button variant="outline">{t("signIn")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {t("form.title")}
              </CardTitle>
              <CardDescription>{t("form.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("form.name")}</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder={t("form.namePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("form.email")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder={t("form.emailPlaceholder")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("form.phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={t("form.phonePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="centerName">{t("form.centerName")}</Label>
                  <Input
                    id="centerName"
                    name="centerName"
                    required
                    placeholder={t("form.centerNamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentCount">{t("form.studentCount")}</Label>
                  <Input
                    id="studentCount"
                    name="studentCount"
                    type="number"
                    min="1"
                    placeholder={t("form.studentCountPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t("form.message")}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder={t("form.messagePlaceholder")}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-gray-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    t("form.submitting")
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t("form.submit")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info & Benefits */}
          <div className="space-y-8">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("info.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("info.email")}</p>
                    <p className="font-medium">support@edura.work</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("info.phone")}</p>
                    <p className="font-medium">09123456789</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("info.address")}</p>
                    <p className="font-medium">Hà Nội, Việt Nam</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Contact Us */}
            <Card>
              <CardHeader>
                <CardTitle>{t("benefits.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{t("benefits.free.title")}</p>
                    <p className="text-sm text-gray-600">
                      {t("benefits.free.description")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t("benefits.setup.title")}</p>
                    <p className="text-sm text-gray-600">
                      {t("benefits.setup.description")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{t("benefits.support.title")}</p>
                    <p className="text-sm text-gray-600">
                      {t("benefits.support.description")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
