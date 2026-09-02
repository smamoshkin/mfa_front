import LegalPage from './LegalPage';
import { prepareLegalMd } from '../../components/legal/prepareLegalMd';
// Единственный источник текста — docs/legal/03-user-agreement-offer.md (пуллится в бандл при сборке)
import source from '../../../docs/legal/03-user-agreement-offer.md?raw';

export default function OfferPage() {
  return (
    <LegalPage
      title="Пользовательское соглашение"
      source={prepareLegalMd(source)}
    />
  );
}
