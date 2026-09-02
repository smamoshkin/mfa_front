/**
 * Убрать редакторские пометки из текста юридического документа перед публикацией:
 * blockquote-заметки ("> Статус документа:", "> Плейсхолдеры..." и т.п.) и маркеры
 * условных разделов оферты [PAYWALL] (вступают в силу с запуском paywall).
 *
 * Вынесено из Markdown.tsx в отдельный модуль (react-refresh требует,
 * чтобы файлы компонентов экспортировали только компоненты).
 */
export function prepareLegalMd(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('>'))
    .join('\n')
    .replace(/\*\*\[PAYWALL\]\*\*/g, '')
    .replace(/\[PAYWALL\]/g, '')
    // схлопнуть лишние пустые строки после удалений
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
