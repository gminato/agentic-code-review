import React from 'react';
import { cn } from '../utils/cn';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  if (!content) return null;

  // Process text line-by-line using a stateful lookahead parser
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let i = 0;
    
    while (i < text.length) {
      // Bold: **
      if (text.startsWith('**', i)) {
        const nextIdx = text.indexOf('**', i + 2);
        if (nextIdx !== -1) {
          tokens.push(
            <strong key={`bold-${i}`} className="font-bold text-on-surface font-sans">
              {parseInlineStyles(text.substring(i + 2, nextIdx))}
            </strong>
          );
          i = nextIdx + 2;
          continue;
        }
      }
      
      // Inline Code: `
      if (text.startsWith('`', i)) {
        const nextIdx = text.indexOf('`', i + 1);
        if (nextIdx !== -1) {
          tokens.push(
            <code key={`code-${i}`} className="bg-obsidian border border-border-primary/60 px-1.5 py-0.5 rounded font-mono text-[10px] text-linear-purple mx-0.5">
              {text.substring(i + 1, nextIdx)}
            </code>
          );
          i = nextIdx + 1;
          continue;
        }
      }
      
      // Italic: *
      if (text.startsWith('*', i)) {
        const nextIdx = text.indexOf('*', i + 1);
        if (nextIdx !== -1) {
          tokens.push(
            <em key={`italic-${i}`} className="italic text-on-surface/90 font-sans">
              {parseInlineStyles(text.substring(i + 1, nextIdx))}
            </em>
          );
          i = nextIdx + 1;
          continue;
        }
      }

      // Link: [text](url)
      if (text.startsWith('[', i)) {
        const closeBracketIdx = text.indexOf(']', i + 1);
        if (closeBracketIdx !== -1 && text.startsWith('(', closeBracketIdx + 1)) {
          const closeParenIdx = text.indexOf(')', closeBracketIdx + 2);
          if (closeParenIdx !== -1) {
            const linkText = text.substring(i + 1, closeBracketIdx);
            const linkUrl = text.substring(closeBracketIdx + 2, closeParenIdx);
            tokens.push(
              <a 
                key={`link-${i}`} 
                href={linkUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-vercel-blue hover:underline font-semibold font-sans transition-colors cursor-pointer"
              >
                {parseInlineStyles(linkText)}
              </a>
            );
            i = closeParenIdx + 1;
            continue;
          }
        }
      }

      // Default: regular text chunk
      let nextSpecial = text.length;
      for (const spec of ['**', '`', '*', '[']) {
        const idx = text.indexOf(spec, i);
        if (idx !== -1 && idx < nextSpecial) {
          nextSpecial = idx;
        }
      }
      
      if (nextSpecial === i) {
        // We are sitting on a special character that was not parsed (e.g., unclosed '*' or '[')
        // Consume this single character as plain text to avoid an infinite loop
        tokens.push(text[i]);
        i++;
      } else {
        tokens.push(text.substring(i, nextSpecial));
        i = nextSpecial;
      }
    }
    
    return tokens;
  };

  const parseTableRow = (rowText: string): string[] => {
    const cells = rowText.split('|');
    if (rowText.trim().startsWith('|')) {
      cells.shift();
    }
    if (rowText.trim().endsWith('|')) {
      cells.pop();
    }
    return cells.map(c => c.trim());
  };

  const parseAlignments = (separatorRow: string): ('left' | 'center' | 'right')[] => {
    const cells = parseTableRow(separatorRow);
    return cells.map(cell => {
      const trimmed = cell.trim();
      const starts = trimmed.startsWith(':');
      const ends = trimmed.endsWith(':');
      if (starts && ends) return 'center';
      if (ends) return 'right';
      return 'left';
    });
  };

  const isSeparator = (str: string): boolean => {
    const trimmed = str.trim();
    if (!trimmed.includes('|')) return false;
    return /^[|:\-\s]+$/.test(trimmed) && trimmed.replace(/[|:\s]/g, '').length > 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines
    if (trimmedLine === '') {
      continue;
    }

    // Handle Code Blocks
    if (trimmedLine.startsWith('```')) {
      const lang = trimmedLine.substring(3).trim();
      const codeLines: string[] = [];
      i++; // Move past the opening ```
      
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      elements.push(
        <div key={`codeblock-${i}`} className="my-3 border border-border-primary/60 rounded-sm bg-obsidian overflow-hidden">
          {lang && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-charcoal border-b border-border-primary/40 select-none">
              <span className="text-[9px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">
                {lang}
              </span>
              <span className="text-[8px] font-mono text-on-surface-variant/40">
                syntax
              </span>
            </div>
          )}
          <pre className="p-3 font-mono text-[10px] overflow-x-auto text-on-surface-variant leading-normal select-text custom-scrollbar bg-obsidian/40">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Handle Horizontal Rules
    if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
      elements.push(
        <hr key={`hr-${i}`} className="my-4 border-t border-border-primary/40" />
      );
      continue;
    }

    // Handle Blockquotes
    if (trimmedLine.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const quoteTrimmed = lines[i].trim();
        const content = quoteTrimmed.substring(1).replace(/^\s/, '');
        quoteLines.push(content);
        i++;
      }
      i--; // Adjust index back
      
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-2 border-linear-purple bg-linear-purple/5 pl-3 py-1.5 my-3 rounded-r-sm text-on-surface/90 italic font-sans">
          {quoteLines.map((ql, qlIdx) => (
            <p key={`qp-${qlIdx}`} className="text-[10.5px] leading-relaxed my-0.5 text-left">
              {parseInlineStyles(ql)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Handle Markdown Tables
    if (trimmedLine.includes('|') && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const tableHeader = parseTableRow(line);
      const tableAlignments = parseAlignments(lines[i + 1]);
      const tableRows: string[][] = [];
      
      i += 2; // Move past header and separator
      while (i < lines.length && lines[i].trim().includes('|') && !isSeparator(lines[i])) {
        tableRows.push(parseTableRow(lines[i]));
        i++;
      }
      i--; // Adjust index back
      
      elements.push(
        <div key={`table-wrapper-${i}`} className="overflow-x-auto my-3 border border-border-primary/60 rounded-sm bg-obsidian/30 backdrop-blur-sm max-w-full">
          <table className="min-w-full border-collapse text-[10.5px] text-on-surface/90">
            <thead>
              <tr className="border-b border-border-primary bg-charcoal text-left font-semibold text-on-surface select-none">
                {tableHeader.map((header, hIdx) => {
                  const align = tableAlignments[hIdx] || 'left';
                  return (
                     <th 
                       key={`th-${hIdx}`} 
                       className={cn(
                         "px-3 py-2 font-mono uppercase tracking-wider text-[9px] border-r last:border-r-0 border-border-primary/40",
                         align === 'center' && 'text-center',
                         align === 'right' && 'text-right',
                         align === 'left' && 'text-left'
                       )}
                     >
                       {parseInlineStyles(header)}
                     </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr 
                  key={`tr-${rIdx}`} 
                  className={cn(
                    "border-b border-border-primary/30 last:border-b-0 hover:bg-charcoal/30 transition-colors",
                    rIdx % 2 === 1 && "bg-charcoal/10"
                  )}
                >
                  {tableHeader.map((_, cIdx) => {
                    const align = tableAlignments[cIdx] || 'left';
                    const cellVal = row[cIdx] || '';
                    return (
                      <td 
                        key={`td-${rIdx}-${cIdx}`} 
                        className={cn(
                          "px-3 py-1.5 border-r last:border-r-0 border-border-primary/30 font-sans",
                          align === 'center' && 'text-center',
                          align === 'right' && 'text-right',
                          align === 'left' && 'text-left'
                        )}
                      >
                        {parseInlineStyles(cellVal)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Handle Bullet Lists
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const curTrim = lines[i].trim();
        if (curTrim.startsWith('- ') || curTrim.startsWith('* ')) {
          listItems.push(curTrim.substring(2));
          i++;
        } else {
          break;
        }
      }
      i--; // Adjust index back

      elements.push(
        <ul key={`ul-${i}`} className="list-none space-y-1.5 my-2.5 pl-1.5">
          {listItems.map((item, itemIdx) => (
            <li key={`li-${itemIdx}`} className="flex items-start gap-2">
              <span className="text-vercel-blue select-none shrink-0 mt-1 text-[10px]">•</span>
              <span className="text-[10.5px] leading-relaxed text-on-surface/90 font-sans text-left">
                {parseInlineStyles(item)}
              </span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Handle Numbered Lists
    const numListMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
    if (numListMatch) {
      const listItems: { num: string; text: string }[] = [];
      while (i < lines.length) {
        const curTrim = lines[i].trim();
        const curMatch = curTrim.match(/^(\d+)\.\s+(.*)/);
        if (curMatch) {
          listItems.push({ num: curMatch[1], text: curMatch[2] });
          i++;
        } else {
          break;
        }
      }
      i--; // Adjust index back

      elements.push(
        <ol key={`ol-${i}`} className="list-none space-y-1.5 my-2.5 pl-1.5">
          {listItems.map((item, itemIdx) => (
            <li key={`li-${itemIdx}`} className="flex items-start gap-2">
              <span className="text-vercel-blue font-mono font-bold select-none shrink-0 text-[10px] mt-0.5 min-w-[14px] text-right">
                {item.num}.
              </span>
              <span className="text-[10.5px] leading-relaxed text-on-surface/90 font-sans text-left">
                {parseInlineStyles(item.text)}
              </span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Handle Headers
    if (trimmedLine.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-[11px] font-bold text-on-surface mt-3.5 mb-1 font-sans flex items-center gap-1.5 uppercase tracking-wider text-vercel-blue select-none">
          <span className="w-1 h-2.5 bg-vercel-blue rounded-full inline-block" />
          {parseInlineStyles(trimmedLine.substring(4))}
        </h4>
      );
      continue;
    }
    if (trimmedLine.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-xs font-bold text-on-surface border-b border-border-primary/50 pb-1 mt-4 mb-2 font-sans tracking-tight">
          {parseInlineStyles(trimmedLine.substring(3))}
        </h3>
      );
      continue;
    }
    if (trimmedLine.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-sm font-extrabold text-on-surface mt-4 mb-2 font-sans tracking-tight">
          {parseInlineStyles(trimmedLine.substring(2))}
        </h2>
      );
      continue;
    }

    // Default: Normal Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-[10.5px] leading-relaxed text-on-surface/85 font-sans my-1.5 text-left">
        {parseInlineStyles(line)}
      </p>
    );
  }

  return <div className={cn("space-y-1.5 text-left", className)}>{elements}</div>;
};
