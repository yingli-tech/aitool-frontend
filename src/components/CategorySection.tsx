import type { AITool } from "../types/tool";
import ToolCard from "./ToolCard";

interface CategorySectionProps {
  title: string;
  tools: AITool[];
}

export default function CategorySection({
  title,
  tools,
}: CategorySectionProps) {
  return (
    <section className="category-section">
      <h2 className="category-title">{title}</h2>

      <div className="tools-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}