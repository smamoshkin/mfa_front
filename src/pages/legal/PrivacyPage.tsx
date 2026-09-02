import LegalPage from './LegalPage';
import { prepareLegalMd } from '../../components/legal/prepareLegalMd';
// Единственный источник текста — docs/legal/01-privacy-policy.md (пуллится в бандл при сборке)
import source from '../../../docs/legal/01-privacy-policy.md?raw';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Политика обработки персональных данных"
      source={prepareLegalMd(source)}
    />
  );
}
