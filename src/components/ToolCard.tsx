import type { AITool } from "../types/tool";

interface ToolCardProps {
  tool: AITool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <article className="directory-tool-card">
      <div className="directory-tool-card-content">
        <h3 className="directory-tool-name">{tool.name}</h3>
        <p className="directory-tool-description">
          {tool.oneLineDesc}
        </p>
      </div>

      <a
        className="directory-tool-link"
        href={tool.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Visit site ↗
      </a>
    </article>
  );
}