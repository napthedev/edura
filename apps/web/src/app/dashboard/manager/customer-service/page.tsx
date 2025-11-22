"use client";

import { useTranslations } from "next-intl";

export default function CustomerServicePage() {
  const t = useTranslations("Dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t("customerService")}</h1>
      <p>{t("customerServiceRequests")}</p>
    </div>
  );
}
