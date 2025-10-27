import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="animate-spin" />
    </div>
  );
}
