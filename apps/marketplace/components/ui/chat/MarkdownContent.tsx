"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders an assistant answer as formatted Markdown (bold, lists, headings,
 * links, blockquotes) instead of raw `**`/`##` text. Colours and base font
 * are inherited from the parent bubble; only structural spacing and the link
 * colour are set here so it drops into either the light or dark chat theme.
 *
 * Safe by default — react-markdown never renders raw HTML (no rehype-raw), so
 * model output can't inject markup. Links open in a new tab.
 */
export function MarkdownContent({
  content,
  linkColor = "#3b82f6",
}: {
  content: string;
  linkColor?: string;
}) {
  return (
    <div className="poysis-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => (
            <p style={{ margin: "0 0 0.6em" }} {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul
              style={{ margin: "0.3em 0 0.6em", paddingLeft: "1.3em", listStyle: "disc" }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{ margin: "0.3em 0 0.6em", paddingLeft: "1.4em", listStyle: "decimal" }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => <li style={{ margin: "0.15em 0" }} {...props} />,
          strong: ({ node, ...props }) => (
            <strong style={{ fontWeight: 600 }} {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h3 style={{ fontSize: "1.15em", fontWeight: 700, margin: "0.6em 0 0.3em" }} {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h3 style={{ fontSize: "1.1em", fontWeight: 700, margin: "0.6em 0 0.3em" }} {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h4 style={{ fontSize: "1.05em", fontWeight: 700, margin: "0.5em 0 0.25em" }} {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              target="_blank"
              rel="noreferrer"
              style={{ color: linkColor, textDecoration: "underline" }}
              {...props}
            />
          ),
          code: ({ node, ...props }) => (
            <code
              style={{
                background: "rgba(0,0,0,0.06)",
                padding: "0.1em 0.3em",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "0.9em",
              }}
              {...props}
            />
          ),
          pre: ({ node, ...props }) => (
            <pre
              style={{
                background: "rgba(0,0,0,0.06)",
                padding: "0.7em",
                borderRadius: "6px",
                overflowX: "auto",
                margin: "0.5em 0",
                fontSize: "0.9em",
              }}
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: "2px solid currentColor",
                opacity: 0.85,
                paddingLeft: "0.8em",
                margin: "0.5em 0",
              }}
              {...props}
            />
          ),
          hr: () => (
            <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.12)", margin: "0.7em 0" }} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
