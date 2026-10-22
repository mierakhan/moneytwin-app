import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders the assistant's markdown (tables, lists, bold) with app styling. */
export default function Markdown({ children, compact = false }: { children: string; compact?: boolean }) {
  return (
    <div className={`markdown ${compact ? "text-xs" : "text-sm"} leading-relaxed text-slate-700`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <p className="mb-1.5 text-sm font-bold text-navy">{children}</p>,
          h2: ({ children }) => <p className="mb-1 mt-2 text-[13px] font-bold text-navy">{children}</p>,
          h3: ({ children }) => <p className="mb-1 mt-2 text-[13px] font-semibold text-navy">{children}</p>,
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-1.5 list-disc space-y-0.5 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="mb-1.5 list-decimal space-y-0.5 pl-4">{children}</ol>,
          li: ({ children }) => <li className="marker:text-slate-400">{children}</li>,
          hr: () => <hr className="my-2 border-line" />,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-blue underline">{children}</a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-navy">{children}</code>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-left text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-canvas">{children}</thead>,
          th: ({ children }) => <th className="border-b border-line px-2.5 py-1.5 font-semibold text-navy">{children}</th>,
          td: ({ children }) => <td className="border-b border-line/70 px-2.5 py-1.5 align-top">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
