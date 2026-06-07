import { CompactMarqueeText } from "./compact-marquee-text";

interface PatternPreviewSnippetProps {
  pattern: string;
  isFingerStyle: boolean;
  maxLength?: number;
  widthClassName?: string;
  className?: string;
}

export function PatternPreviewSnippet({
  pattern,
  isFingerStyle,
  maxLength = 28,
  widthClassName = "w-[5.5rem]",
  className,
}: PatternPreviewSnippetProps) {
  if (!pattern) return null;

  const preview =
    pattern.length > maxLength ? `${pattern.slice(0, maxLength)}…` : pattern;
  const text = isFingerStyle ? preview : preview.split("").join(" ");

  return (
    <CompactMarqueeText
      text={text}
      widthClassName={widthClassName}
      className={className}
    />
  );
}
