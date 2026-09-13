/**
 * Os dados de contribuição são reais ou ainda são o exemplo do seed?
 *
 * `SiteSettings` nasce semeado com valores de demonstração (e, antes do
 * rebrand, com os dados de outra igreja). Publicar qualquer um dos dois numa
 * página de doação seria pior do que não publicar nada — dinheiro real
 * envolvido. Enquanto a igreja não salvar os dados dela em
 * /admin/configuracoes, a página mostra `[CONTEÚDO PENDENTE]`.
 */

const PLACEHOLDER_PIX_KEYS = new Set(["00.000.000/0001-00", "000.000.000-00", ""]);
const PLACEHOLDER_BANKS = new Set(["Banco Exemplo S.A.", ""]);
const PLACEHOLDER_HOLDERS = new Set(["Igreja Remida BC", ""]);

export interface DonationSettings {
  pixKey: string;
  pixKeyType: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  bankHolder: string;
}

export function hasRealPixKey(settings: DonationSettings) {
  return !PLACEHOLDER_PIX_KEYS.has(settings.pixKey.trim());
}

export function hasRealBankDetails(settings: DonationSettings) {
  return (
    !PLACEHOLDER_BANKS.has(settings.bankName.trim()) &&
    !PLACEHOLDER_HOLDERS.has(settings.bankHolder.trim())
  );
}
