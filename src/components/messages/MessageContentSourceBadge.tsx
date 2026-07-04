import { Badge } from "@/components/ui/badge";
import {
  messageContentSourceLabel,
  messageContentSourceVariant,
} from "@/lib/message-content-source";
import { cn } from "@/lib/utils";

type Props = {
  source: string | null | undefined;
  className?: string;
};

export function MessageContentSourceBadge({ source, className }: Props) {
  if (!source) return null;

  return (
    <Badge variant={messageContentSourceVariant(source)} className={cn("text-[10px]", className)}>
      {messageContentSourceLabel(source)}
    </Badge>
  );
}
