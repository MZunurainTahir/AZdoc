import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Simple clean markdown parser & renderer
  const renderMarkdown = (text: string) => {
    // 1. Process block elements like tables
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let listItems: string[] = [];
    let isNumberedList = false;

    const flushList = (keyPrefix: string) => {
      if (listItems.length > 0) {
        if (isNumberedList) {
          elements.push(
            <ol key={`${keyPrefix}-ol`} className="list-decimal list-inside my-2 space-y-1 pl-1">
              {listItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {formatInline(item)}
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`${keyPrefix}-ul`} className="list-disc list-inside my-2 space-y-1 pl-1">
              {listItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {formatInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        listItems = [];
      }
    };

    const flushTable = (keyPrefix: string) => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const rows = tableRows.slice(1);
        elements.push(
          <div key={`${keyPrefix}-table`} className="my-3 overflow-x-auto rounded-xl border border-border bg-bg-secondary/40 p-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-primary/10 border-b border-border">
                  {header.map((col, idx) => (
                    <th key={idx} className="px-3 py-2 font-bold text-primary">
                      {formatInline(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-border/40 hover:bg-bg-elevated/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-text-primary">
                        {formatInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Table line detect
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList(`line-${index}`);
        const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
        // Ignore separator row like |---|---|
        if (cells.every(c => /^[-:]+$/.test(c))) {
          return;
        }
        inTable = true;
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable(`line-${index}`);
      }

      // List detect
      if (/^[-*•]\s+/.test(trimmed)) {
        if (isNumberedList && listItems.length > 0) flushList(`line-${index}`);
        isNumberedList = false;
        listItems.push(trimmed.replace(/^[-*•]\s+/, ''));
        return;
      } else if (/^\d+\.\s+/.test(trimmed)) {
        if (!isNumberedList && listItems.length > 0) flushList(`line-${index}`);
        isNumberedList = true;
        listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
        return;
      } else {
        flushList(`line-${index}`);
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-sm font-bold text-primary mt-3 mb-1">
            {formatInline(trimmed.replace(/^###\s+/, ''))}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-base font-bold text-primary mt-3 mb-1.5 border-b border-border pb-1">
            {formatInline(trimmed.replace(/^##\s+/, ''))}
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-lg font-extrabold text-primary mt-4 mb-2">
            {formatInline(trimmed.replace(/^#\s+/, ''))}
          </h1>
        );
      } else if (trimmed === '') {
        elements.push(<div key={index} className="h-2" />);
      } else {
        elements.push(
          <p key={index} className="my-1 leading-relaxed">
            {formatInline(trimmed)}
          </p>
        );
      }
    });

    flushList('end');
    flushTable('end');

    return elements;
  };

  // Inline formatter for **bold**, *italic*, `code`
  const formatInline = (text: string): React.ReactNode => {
    if (!text) return null;

    // Replace **bold** with <strong>
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-text-primary">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="italic text-text-secondary">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="px-1.5 py-0.5 rounded bg-bg-secondary font-mono text-xs text-primary">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  // Detect Urdu text for direction
  const isUrdu = /[\u0600-\u06FF]/.test(content);

  return (
    <div className={`markdown-content text-sm space-y-1 ${isUrdu ? 'rtl text-right font-sans' : 'ltr text-left'} ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
};
