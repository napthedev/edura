"use client";
import { api } from "@edura/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

export default function Home() {
  const t = useTranslations("HomePage");
  const healthCheck = useQuery(api.healthCheck.get);

  const getStatusColor = () => {
    if (healthCheck === "OK") {
      return "bg-green-500";
    }
    if (healthCheck === undefined) {
      return "bg-orange-400";
    }
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (healthCheck === undefined) {
      return t("checking");
    }
    if (healthCheck === "OK") {
      return t("connected");
    }
    return t("error");
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h1 className="mb-4 font-bold text-2xl">{t("title")}</h1>
          <p className="mb-4 text-muted-foreground">{t("description")}</p>

          <div className="mb-4">
            <h2 className="mb-2 font-medium">{t("apiStatus")}</h2>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
              <span className="text-muted-foreground text-sm">
                {getStatusText()}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
