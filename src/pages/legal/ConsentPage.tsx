import LegalPage from './LegalPage';
import { prepareLegalMd } from '../../components/legal/prepareLegalMd';
// Единственный источник текста — docs/legal/02-consent-pd.md.
// Публикуется только секция «Б» (полный текст согласия): секции А и В —
// рабочие инструкции (тексты чекбоксов), на сайт они не выкладываются.
import source from '../../../docs/legal/02-consent-pd.md?raw';

function extractConsentBody(raw: string): string {
  const startMarker = '## Б.';
  const endMarker = '## В.';
  const start = raw.indexOf(startMarker);
  const end = raw.indexOf(endMarker);
  let body = start !== -1 ? raw.slice(start, end !== -1 ? end : undefined) : raw;

  // Убрать строку-заголовок секции «## Б. Полный текст согласия (страница /consent)»
  body = body.slice(body.indexOf('\n') + 1);
  // Шапка «СОГЛАСИЕ / на обработку персональных данных» — в подзаголовок
  body = body.replace(
    'СОГЛАСИЕ\nна обработку персональных данных',
    '## СОГЛАСИЕ на обработку персональных данных'
  );

  return prepareLegalMd(body);
}

export default function ConsentPage() {
  return (
    <LegalPage
      title="Согласие на обработку персональных данных"
      source={extractConsentBody(source)}
    />
  );
}
