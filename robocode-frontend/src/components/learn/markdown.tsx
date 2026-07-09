import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders trusted lesson markdown as styled HTML using the shared `.md-body`
 *  typography. Standalone runnable examples use the dedicated `code` block type. */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="md-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
