import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AssistantMarkdown({ text }: { text: string }) {
  return <div className="gis-ai-markdown min-w-0 pb-4 [&>*+*]:mt-3 [&_h1]:text-[16px] [&_h1]:leading-6 [&_h2]:text-[14px] [&_h2]:leading-5 [&_h3]:text-[12px] [&_h3]:leading-4 [&_h1]:font-medium [&_h2]:font-medium [&_h3]:font-medium [&_strong]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li+li]:mt-1 [&_li>p]:my-1 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-600 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-neutral-100 [&_pre]:p-3 [&_pre]:whitespace-pre [&_code]:font-mono [&_code]:text-[11px] [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-neutral-300 [&_th]:p-2 [&_th]:text-left [&_th]:font-medium [&_td]:border [&_td]:border-neutral-300 [&_td]:p-2 [&_hr]:border-neutral-300">
    <Markdown skipHtml remarkPlugins={[remarkGfm]} components={{
      table: ({ children }) => <div className="max-w-full overflow-x-auto"><table>{children}</table></div>,
      img: ({ alt }) => <span>{alt}</span>,
    }}>{text}</Markdown>
  </div>;
}
