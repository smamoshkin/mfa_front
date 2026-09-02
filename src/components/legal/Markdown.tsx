import { ReactNode } from 'react';

/**
 * Лёгкий рендерер markdown для юридических страниц (docs/legal/*.md, импорт через ?raw).
 * Поддерживает подмножество синтаксиса, используемое в документах:
 * заголовки #/##/###, абзацы, **жирный**, *курсив*, `код`, списки - и 1. с вложенными
 * подпунктами, таблицы | a | b |, горизонтальную черту --- и ```блоки кода```.
 *
 * Служебную предобработку текста (срез редакторских пометок) выполняет
 * prepareLegalMd.ts — см. этот модуль.
 */

/** Инлайновая разметка: **жирный**, *курсив*, `код` */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-app">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key} className="px-1.5 py-0.5 bg-card-2 border border-card rounded text-[0.85em] text-app-2">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Пункт списка: текст + вложенные подпункты ("- ..." с отступом) */
interface ListItem {
  text: string;
  children: string[];
}

interface Block {
  type: 'heading' | 'paragraph' | 'ul' | 'ol' | 'table' | 'code' | 'hr';
  level?: number;
  text?: string;
  items?: ListItem[];
  rows?: string[][];
}

function parseBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const isTableSeparator = (l: string) => /^\s*\|[\s:-]+\|[\s|:-]*$/.test(l);
  const splitRow = (l: string) =>
    l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

  // Верхний уровень: "1. текст" (ol) или "- текст" (ul) без отступа.
  // Дети: "   - текст" с отступом ≥2 пробелов — подсписок последнего пункта.
  // Пустые строки внутри блока не разрывают список, если дальше снова его элемент.
  const topOl = (l: string) => /^\d+\.\s+/.test(l);
  const topUl = (l: string) => /^-\s+/.test(l);
  const childItem = (l: string) => /^\s{2,}-\s+/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // fenced code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // закрывающая ```
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    // heading
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }

    // hr
    if (/^\s*---+\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // table: строка-заголовок + разделитель |---|---|
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const rows: string[][] = [splitRow(line)];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }

    // list (ol/ul) с вложенными подпунктами
    if (topOl(line) || topUl(line)) {
      const ordered = topOl(line);
      const items: ListItem[] = [];
      let current: ListItem = { text: '', children: [] };
      const content = (l: string) =>
        (ordered ? l.match(/^\d+\.\s+(.*)$/) : l.match(/^-\s+(.*)$/))![1];

      const continuesList = (l: string) =>
        (ordered ? topOl(l) : topUl(l)) || childItem(l);

      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) {
          // пустая строка: список продолжается, только если дальше снова его элемент
          let j = i;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && continuesList(lines[j])) { i = j; continue; }
          break;
        }
        if ((ordered ? topOl(l) : topUl(l))) {
          current = { text: content(l), children: [] };
          items.push(current);
          i++;
        } else if (childItem(l)) {
          current.children.push(l.replace(/^\s{2,}-\s+/, ''));
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }

    // paragraph — до первой пустой строки или начала другого блока
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3})\s/.test(lines[i]) &&
      !/^\s*-\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*---+\s*$/.test(lines[i]) &&
      !lines[i].trim().startsWith('```') &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

function TableBlock({ rows }: { rows: string[][] }) {
  const [header, ...body] = rows;
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-card">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-card-2">
            {header.map((cell, j) => (
              <th
                key={j}
                className="text-left px-4 py-2.5 font-semibold text-app border-b border-card whitespace-nowrap"
              >
                {renderInline(cell, `th-${j}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, r) => (
            <tr key={r} className="border-b border-card last:border-b-0 align-top">
              {row.map((cell, c) => (
                <td key={c} className="px-4 py-2.5 text-app-2">
                  {renderInline(cell, `td-${r}-${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);

  return (
    <div className="text-app-2 leading-relaxed">
      {blocks.map((block, idx) => {
        const key = `b-${idx}`;
        switch (block.type) {
          case 'heading':
            if (block.level === 1) {
              return (
                <h1 key={key} className="text-2xl sm:text-3xl font-bold text-app mb-4 mt-8 first:mt-0">
                  {renderInline(block.text ?? '', key)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2 key={key} className="text-lg sm:text-xl font-bold text-app mb-3 mt-8 pt-6 border-t border-card first:border-t-0 first:pt-0">
                  {renderInline(block.text ?? '', key)}
                </h2>
              );
            }
            return (
              <h3 key={key} className="text-base font-semibold text-app mb-2 mt-5">
                {renderInline(block.text ?? '', key)}
              </h3>
            );
          case 'paragraph':
            return (
              <p key={key} className="mb-4">
                {renderInline(block.text ?? '', key)}
              </p>
            );
          case 'ul':
          case 'ol': {
            const Tag = block.type === 'ol' ? 'ol' : 'ul';
            return (
              <Tag
                key={key}
                className={`mb-4 space-y-2 list-outside pl-5 ${
                  block.type === 'ol' ? 'list-decimal' : 'list-disc'
                }`}
              >
                {(block.items ?? []).map((item, j) => (
                  <li key={j}>
                    {renderInline(item.text, `${key}-${j}`)}
                    {item.children.length > 0 && (
                      <ul className="mt-1.5 space-y-1 list-disc list-outside pl-5">
                        {item.children.map((child, k) => (
                          <li key={k}>{renderInline(child, `${key}-${j}-c${k}`)}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </Tag>
            );
          }
          case 'table':
            return <TableBlock key={key} rows={block.rows ?? []} />;
          case 'code':
            return (
              <pre
                key={key}
                className="mb-4 p-4 rounded-xl bg-card-2 border border-card text-sm text-app-2 whitespace-pre-wrap"
              >
                {block.text}
              </pre>
            );
          case 'hr':
            return <hr key={key} className="my-8 border-card" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
