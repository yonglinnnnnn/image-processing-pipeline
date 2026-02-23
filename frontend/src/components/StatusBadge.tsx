import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "success")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Success
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
        <AlertCircle className="w-3 h-3 mr-1" /> Failed
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
      <Clock className="w-3 h-3 mr-1" /> Processing
    </Badge>
  );
}
