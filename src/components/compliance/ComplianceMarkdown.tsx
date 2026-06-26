import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
};

export function ComplianceMarkdown({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 font-serif text-2xl font-semibold tracking-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-6 font-serif text-xl font-semibold tracking-tight">{children}</h2>
        ),
        h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>,
        p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground/90">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="mb-4 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[32rem] text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
        th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
        td: ({ children }) => <td className="border-t px-3 py-2 align-top">{children}</td>,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
        ),
        hr: () => <hr className="my-6 border-border/70" />,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
