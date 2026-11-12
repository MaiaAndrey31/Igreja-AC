/**
 * Script de importação idempotente das 61 células para o Firestore.
 *
 * Uso:
 *   npx tsx scripts/seed-cells.ts              # modo preview (não grava)
 *   npx tsx scripts/seed-cells.ts --confirm     # grava de fato
 *
 * Regras:
 * - Usa `sourceId` como chave de deduplicação (nunca sobrescreve por nome).
 * - Preserva alterações manuais: se um documento já existe com o mesmo sourceId
 *   e tem coordenadas verificadas ou status "manual", NÃO sobrescreve esses campos.
 * - Não publica automaticamente: `published` começa como false.
 * - Não inventa coordenadas: latitude/longitude ficam null até geocodificação.
 * - Sinaliza registros com dados ausentes como `reviewStatus: "needs_review"`.
 */

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------------------------
// Inicialização Firebase Admin (mesmo padrão de src/lib/firebase/admin.ts)
// ---------------------------------------------------------------------------

function initAdmin() {
 if (getApps().length > 0) return getFirestore();

 const projectId = process.env.FIREBASE_PROJECT_ID;
 const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
 const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

 if (!projectId || !clientEmail || !privateKey) {
 throw new Error(
 "Credenciais do Firebase ausentes. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env"
 );
 }

 initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
 return getFirestore();
}

// ---------------------------------------------------------------------------
// Normalização de cidade → slug
// ---------------------------------------------------------------------------

function normalizeCitySlug(city: string | null): string | null {
 if (!city) return null;
 return city
 .normalize("NFD")
 .replace(/[̀-ͯ]/g, "")
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Dados brutos das 61 células
// ---------------------------------------------------------------------------

interface RawCell {
 sourceId: string;
 name: string;
 region: "vermelha" | "verde" | "amarela" | "azul" | "laranja" | null;
 profile: string | null;
 meetingDay: string | null;
 meetingTime: string | null;
 dayTime: string;
 address: string | null;
 neighborhood: string | null;
 city: string | null;
 leaderName: string;
 reviewNotes: string[];
}

const RAW_CELLS: RawCell[] = [
 { sourceId: "01", name: "A serviço do Rei (Min Silvia)", region: "vermelha", profile: "Adultos", meetingDay: "Terça", meetingTime: "19:00", dayTime: "3ª às 19:00", address: "Rua Libero Badaró, 515", neighborhood: "Vila Jamil de Lima", city: "Adamantina", leaderName: "Silvia", reviewNotes: [] },
 { sourceId: "02", name: "Aba Pai (Flórida Paulista)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Francisco Dias das Neves, 331", neighborhood: "Centro", city: "Flórida Paulista", leaderName: "", reviewNotes: [] },
 { sourceId: "03", name: "Arca da Aliança II (João Carlos Nunes)", region: "amarela", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Paraná, 514", neighborhood: "Jardim Brasil", city: "Adamantina", leaderName: "João Carlos Nunes", reviewNotes: [] },
 { sourceId: "04", name: "Beréia II (Célia e Maria Ismeraldina)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua José Garcia Lopes, 05", neighborhood: "Conjunto Gov. Mário Covas", city: "Adamantina", leaderName: "Célia e Maria Ismeraldina", reviewNotes: [] },
 { sourceId: "05", name: "Beréia IX (Marcos Camilo)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Santa Mercedes, 30", neighborhood: "Jardim América", city: "Adamantina", leaderName: "Marcos Camilo", reviewNotes: [] },
 { sourceId: "06", name: "Beréia VII (Rafaela e Fernanda Shimada)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua José Miguel, 17", neighborhood: "Monte Alegre", city: "Adamantina", leaderName: "Rafaela e Fernanda Shimada", reviewNotes: [] },
 { sourceId: "07", name: "Beréia X (Matheus Fabro)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Basílio Marini, 182", neighborhood: "Jardim Adamantina", city: "Lucélia", leaderName: "Matheus Fabro", reviewNotes: [] },
 { sourceId: "08", name: "Bianca", region: "azul", profile: "Moças - Alive Up", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Tarao Kido, 61", neighborhood: "Parque Iguaçu", city: "Adamantina", leaderName: "", reviewNotes: ["Mesmo endereço que célula 33 (Maranata IV), bairros diferentes — verificar"] },
 { sourceId: "09", name: "Canaã (Lucimar - Mariápolis)", region: "verde", profile: "Normal", meetingDay: "Terça", meetingTime: "20:00", dayTime: "3ª às 20:00", address: "Rua Roberto Melchert, 740", neighborhood: "Centro", city: "Mariápolis", leaderName: "Lucimar", reviewNotes: [] },
 { sourceId: "10", name: "Célula Betsal'el (Yasmin Rovez)", region: "azul", profile: "Casais - Alive", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Francisco Alves, 117", neighborhood: "Jardim Ipiranga", city: "Adamantina", leaderName: "Yasmin Rovez", reviewNotes: [] },
 { sourceId: "11", name: "Efraim (Ana Vitória Rocha)", region: "azul", profile: "Mista - Alive Livre", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua São Paulo, 55", neighborhood: "Jardim Brasil", city: "Adamantina", leaderName: "Ana Vitória Rocha", reviewNotes: [] },
 { sourceId: "12", name: "Eis Me Aqui IV (Ziza e Jaqueline Costa)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Noel Rosa, 1004", neighborhood: "Jardim Ipiranga", city: "Adamantina", leaderName: "Ziza e Jaqueline Costa", reviewNotes: [] },
 { sourceId: "13", name: "Eis Me Aqui Kids (Joice)", region: "laranja", profile: "Crianças - Kids", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Sebastião Jorge de Oliveira, 09", neighborhood: "Conjunto Bandeirantes", city: "Adamantina", leaderName: "Joice", reviewNotes: [] },
 { sourceId: "14", name: "Eis Me Aqui VX (José Machado e Nilton)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Onofre Possari, 175", neighborhood: "Residencial São José", city: "Adamantina", leaderName: "José Machado e Nilton", reviewNotes: [] },
 { sourceId: "15", name: "Eis Me Aqui XII (Dr. Marcelo e Lisa)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Tesifão Quevedo Perez, 60", neighborhood: "Residencial Santa Mônica", city: "Adamantina", leaderName: "Dr. Marcelo e Lisa", reviewNotes: [] },
 { sourceId: "16", name: "Eis Me Aqui XIII (Daiane e Nete)", region: "vermelha", profile: "Normal", meetingDay: "Terça", meetingTime: "20:00", dayTime: "Terça às 20:00", address: "Alameda Padre Nóbrega, 1068", neighborhood: "Centro", city: "Adamantina", leaderName: "Daiane e Nete", reviewNotes: [] },
 { sourceId: "17", name: "Eis Me Aqui XVI (Marcos Suna e Paula)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Sebastião Jorge de Oliveira, 09", neighborhood: "Conjunto Bandeirantes", city: "Adamantina", leaderName: "Marcos Suna e Paula", reviewNotes: ["Mesma numeração romana XVI que célula 18 — verificar"] },
 { sourceId: "18", name: "Eis Me Aqui XVI (Silvia e Danielle)", region: "vermelha", profile: "Normal", meetingDay: "Terça", meetingTime: "20:00", dayTime: "3ª às 20:00", address: "Rua Cônego João Batista de Aquino, 193", neighborhood: "Centro", city: "Adamantina", leaderName: "Silvia e Danielle", reviewNotes: ["Mesma numeração romana XVI que célula 17 — verificar"] },
 { sourceId: "19", name: "El Rafah (Adriana Castorino)", region: "vermelha", profile: "Adultos", meetingDay: "Terça", meetingTime: "19:00", dayTime: "Terça às 19:00", address: "Rua Tatsuo Inada, 125", neighborhood: "Parque Residencial Iguaçu", city: "Adamantina", leaderName: "Adriana Castorino", reviewNotes: [] },
 { sourceId: "20", name: "Emanuel", region: "verde", profile: "Adultos", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rancisco Dias das Neves, 995", neighborhood: "Centro", city: "Flórida Paulista", leaderName: "", reviewNotes: ["Possível erro em 'Rancisco' — deveria ser 'Francisco'?"] },
 { sourceId: "21", name: "Emunah (Flórida Paulista)", region: "azul", profile: "Adolescentes e Jovens", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Antônio Boton, 62", neighborhood: "Centro", city: "Flórida Paulista", leaderName: "", reviewNotes: [] },
 { sourceId: "22", name: "Estrela de Davi (Letícia Vitório)", region: "amarela", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Alameda Porto Alegre, 180", neighborhood: "Vila Jamil de Lima", city: "Adamantina", leaderName: "Letícia Vitório", reviewNotes: [] },
 { sourceId: "23", name: "Isabel Matos", region: "laranja", profile: "Crianças - Kids", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Mato Grosso, 154", neighborhood: "Jardim Brasil", city: "Adamantina", leaderName: "Isabel Matos", reviewNotes: [] },
 { sourceId: "24", name: "Isabel Monari", region: "vermelha", profile: "Normal", meetingDay: "Segunda", meetingTime: "20:00", dayTime: "Segunda às 20:00", address: "Rua Juvenal de Santis, 122", neighborhood: "Jardim Monte Alegre", city: "Adamantina", leaderName: "Isabel Monari", reviewNotes: [] },
 { sourceId: "25", name: "Jabez III", region: "verde", profile: "Normal", meetingDay: "Segunda", meetingTime: "20:00", dayTime: "Segunda às 20:00", address: "Rua Tibiriça, 176", neighborhood: "Centro", city: null, leaderName: "", reviewNotes: ["CIDADE NÃO INFORMADA — não atribuir automaticamente"] },
 { sourceId: "26", name: "Jabez IV", region: "verde", profile: "Adultos", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Kaichi Fujita, 202", neighborhood: "Centro", city: "Inúbia Paulista", leaderName: "", reviewNotes: [] },
 { sourceId: "27", name: "Jessiquinha", region: "laranja", profile: "Crianças - Kids", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Cônego João Batista de Aquino, 193", neighborhood: "Centro", city: "Adamantina", leaderName: "", reviewNotes: [] },
 { sourceId: "28", name: "José Matheus", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Alameda Maria Cândida Romanini, 1227", neighborhood: "Vila Joaquina", city: "Adamantina", leaderName: "", reviewNotes: [] },
 { sourceId: "29", name: "Luz do Mundo (Alison e Eunice)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Zequinha de Abreu, 156", neighborhood: "Jardim Ipiranga", city: "Adamantina", leaderName: "Alison e Eunice", reviewNotes: [] },
 { sourceId: "30", name: "Manancial 2 (Gislaine Pernomian e Fabiana)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta às 20:00", address: "Rua Sabino Capaldi, 131", neighborhood: "Jardim das Acácias", city: "Adamantina", leaderName: "Gislaine Pernomian e Fabiana", reviewNotes: [] },
 { sourceId: "31", name: "Maranata (Josefa e Ana Paula)", region: "amarela", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Paschoal Rissoli, 44", neighborhood: "Parque Itapuã", city: "Adamantina", leaderName: "Josefa e Ana Paula", reviewNotes: [] },
 { sourceId: "32", name: "Maranata III (Pereirão)", region: "amarela", profile: "Normal", meetingDay: "Segunda", meetingTime: "20:00", dayTime: "Segunda 20:00", address: "Rua Francisco Alves, 237", neighborhood: "Jardim Ipiranga", city: "Adamantina", leaderName: "Pereirão", reviewNotes: [] },
 { sourceId: "33", name: "Maranata IV (Cid Santos)", region: "amarela", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Tarao Kido, 61", neighborhood: "Residencial Iguaçu", city: "Adamantina", leaderName: "Cid Santos", reviewNotes: ["Mesmo endereço que célula 08 (Bianca), bairros diferentes — verificar"] },
 { sourceId: "34", name: "Maria Eduarda", region: "azul", profile: "Universitária - Mista", meetingDay: "Quarta", meetingTime: "22:00", dayTime: "Quarta 22:00", address: "Rua Tasuo Inada, 125", neighborhood: "Jardim Ipiranga", city: "Adamantina", leaderName: "", reviewNotes: ["Possível erro em 'Tasuo Inada' — deveria ser 'Tatsuo Inada'?"] },
 { sourceId: "35", name: "Maria Gabriella Moura", region: "azul", profile: "Universitária - Mista", meetingDay: "Quarta", meetingTime: "22:00", dayTime: "Quarta 22:00", address: "Avenida Bráulio Molina Frias, 313", neighborhood: "Vila Cicma", city: "Adamantina", leaderName: "", reviewNotes: [] },
 { sourceId: "36", name: "Marisa Fagundes", region: "laranja", profile: "Crianças - Kids", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Tibiriça, 176", neighborhood: "Centro", city: "Inúbia Paulista", leaderName: "Marisa Fagundes", reviewNotes: [] },
 { sourceId: "37", name: "Miguel Munhoz", region: "laranja", profile: "Crianças - Kids", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Zequinha de Abreu, 156", neighborhood: "Jardim Ipiranga", city: "Adamantina", leaderName: "", reviewNotes: [] },
 { sourceId: "38", name: "Onfire I (Miguel Castorino)", region: "azul", profile: "Adolescente", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Tasuo Inada, 125", neighborhood: "Parque Iguaçu", city: "Adamantina", leaderName: "Miguel Castorino", reviewNotes: ["Possível erro em 'Tasuo Inada' — deveria ser 'Tatsuo Inada'?"] },
 { sourceId: "39", name: "Peniel III (Daniel e Jhonatan)", region: "amarela", profile: "Normal", meetingDay: "Segunda", meetingTime: "20:00", dayTime: "Segunda 20:00", address: "Rua da Liberdade, 404", neighborhood: "Jamil de Lima", city: "Adamantina", leaderName: "Daniel e Jhonatan", reviewNotes: [] },
 { sourceId: "40", name: "Peniel V (Débora Lira)", region: "amarela", profile: "Normal", meetingDay: "Quinta", meetingTime: "20:00", dayTime: "Quinta 20:00", address: "Rua Turquesa, 219", neighborhood: "Residencial Guliano", city: "Adamantina", leaderName: "Débora Lira", reviewNotes: [] },
 { sourceId: "41", name: "Peregrinos (Nicolas e Mozart – Inúbia Paulista)", region: "azul", profile: "Mista - Alive Up", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Antônio Facco, 424", neighborhood: "Centro", city: "Inúbia Paulista", leaderName: "Nicolas e Mozart", reviewNotes: [] },
 { sourceId: "42", name: "Rede Ao Mar 3 (Adilson e Maria)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Siqueira Campos, 345", neighborhood: "Residencial Itamarati", city: "Adamantina", leaderName: "Adilson e Maria", reviewNotes: [] },
 { sourceId: "43", name: "Rede Ao Mar 4 (Alex da Silva)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Cambará, 74", neighborhood: "Parque Itaipus", city: "Adamantina", leaderName: "Alex da Silva", reviewNotes: [] },
 { sourceId: "44", name: "Rede Ao Mar III (Marta)", region: "laranja", profile: "Crianças - Kids", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Cambará, 74", neighborhood: "Itaipus", city: "Adamantina", leaderName: "Marta", reviewNotes: [] },
 { sourceId: "45", name: "Renascer 2 (Roseli e Cido)", region: "vermelha", profile: "Normal", meetingDay: null, meetingTime: null, dayTime: "REUNIÃO NÃO INFORMADA", address: null, neighborhood: null, city: null, leaderName: "Roseli e Cido", reviewNotes: ["Sem reunião, endereço, bairro e cidade informados"] },
 { sourceId: "46", name: "Resgate (Pacaembu)", region: "verde", profile: "Normal", meetingDay: "Segunda", meetingTime: "20:00", dayTime: "Segunda 20:00", address: "Av. São João, 1219", neighborhood: "Vila Peres", city: "Pacaembu", leaderName: "", reviewNotes: ["Mesmo endereço que célula 47 (Resgate Kids), bairros diferentes — verificar"] },
 { sourceId: "47", name: "Resgate Kids (Ana Paula)", region: "laranja", profile: "Crianças - Kids", meetingDay: "Segunda", meetingTime: "20:00", dayTime: "Segunda 20:00", address: "Av. São João, 1219", neighborhood: "Guaraniuva", city: "Pacaembu", leaderName: "Ana Paula", reviewNotes: ["Mesmo endereço que célula 46 (Resgate), bairros diferentes — verificar"] },
 { sourceId: "48", name: "Ruah (Gabi Calil)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Saveiro Luiz de Barros, 61", neighborhood: "Monte Alegre", city: "Adamantina", leaderName: "Gabi Calil", reviewNotes: [] },
 { sourceId: "49", name: "Ruah 2 (Jorge Sakai)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Estrada Aldeia, 321", neighborhood: "Granja Viana", city: "São Paulo", leaderName: "Jorge Sakai", reviewNotes: ["Confirmar cidade e vínculo administrativo — São Paulo pode ser sede distinta"] },
 { sourceId: "50", name: "Sergio Bonfim", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Saturnino de Castro, 13", neighborhood: "Jardim Primavera", city: "Adamantina", leaderName: "", reviewNotes: [] },
 { sourceId: "51", name: "Shalom (José Marcelino e Luzia)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Antonio Schimidt Vilela, 947", neighborhood: "Santa Inês", city: "Adamantina", leaderName: "José Marcelino e Luzia", reviewNotes: ["Conferir grafia do logradouro"] },
 { sourceId: "52", name: "Shekina 2 (Marcelo Augusto)", region: "verde", profile: "Normal", meetingDay: "Segunda", meetingTime: "20:00", dayTime: "Segunda 20:00", address: "Mário Pataro, 111", neighborhood: "Vila Cicma", city: "Adamantina", leaderName: "Marcelo Augusto", reviewNotes: [] },
 { sourceId: "53", name: "Shekinah I (Nelson)", region: "verde", profile: "Normal", meetingDay: "Segunda", meetingTime: "20:00", dayTime: "Segunda 20:00", address: "Rua Guerino Dorigo, 251", neighborhood: "Estância Dorigo", city: "Adamantina", leaderName: "Nelson", reviewNotes: [] },
 { sourceId: "54", name: "Shekinah IV (Luciana Medina)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Bahia, 269", neighborhood: "Jardim Brasil", city: "Adamantina", leaderName: "Luciana Medina", reviewNotes: [] },
 { sourceId: "55", name: "Sozo (Gilberto e Mariana Lemes)", region: "amarela", profile: "Adultos", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Via João Nunes Júnior, 07", neighborhood: "Cond. Res. Ecoville I", city: "Adamantina", leaderName: "Gilberto e Mariana Lemes", reviewNotes: [] },
 { sourceId: "56", name: "Terra Prometida I (Marcial)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Tesifão Quevedo Peres, 29", neighborhood: "Residencial Santa Mônica", city: "Adamantina", leaderName: "Marcial", reviewNotes: [] },
 { sourceId: "57", name: "Uma Nova Unção (Karina e Dirce)", region: "vermelha", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Mário Pataro, 122", neighborhood: "Vila Cicma", city: "Adamantina", leaderName: "Karina e Dirce", reviewNotes: [] },
 { sourceId: "58", name: "Yeshua (Luisa Risso e Rafael)", region: "amarela", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Mainá, 50", neighborhood: "Parque Tangará", city: "Adamantina", leaderName: "Luisa Risso e Rafael", reviewNotes: [] },
 { sourceId: "59", name: "Yeshua II (Fabricio)", region: "amarela", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua José Bortoleto, 169", neighborhood: "Jardim Adamantina", city: "Adamantina", leaderName: "Fabricio", reviewNotes: [] },
 { sourceId: "60", name: "Yeshua Kids (Luana Benite)", region: "laranja", profile: "Crianças - Kids", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Diamante, 300", neighborhood: "Residencial Eldorado", city: "Adamantina", leaderName: "Luana Benite", reviewNotes: [] },
 { sourceId: "61", name: "Zoe (Lucas)", region: "verde", profile: "Normal", meetingDay: "Quarta", meetingTime: "20:00", dayTime: "Quarta 20:00", address: "Rua Padre Caetano Maria Dolcimaculo, 380", neighborhood: "Residencial Ecoville II", city: "Adamantina", leaderName: "Lucas", reviewNotes: [] },
];

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

async function main() {
 const confirm = process.argv.includes("--confirm");
 const db = initAdmin();
 const cellsRef = db.collection("cells");

 // Busca documentos existentes indexados por sourceId
 const existingSnap = await cellsRef.where("sourceId", "!=", null).get();
 const existingBySourceId = new Map<string, FirebaseFirestore.DocumentData>();
 for (const doc of existingSnap.docs) {
 const data = doc.data();
 if (data.sourceId) existingBySourceId.set(data.sourceId, { ...data, _docId: doc.id });
 }

 let toCreate = 0;
 let toUpdate = 0;
 let toSkip = 0;
 const needsReview: string[] = [];

 console.log(`\n📋 PREVIEW DA IMPORTAÇÃO (${RAW_CELLS.length} registros)\n`);

 for (const raw of RAW_CELLS) {
 const citySlug = normalizeCitySlug(raw.city);
 const hasReviewNotes = raw.reviewNotes.length > 0;
 const missingCritical = !raw.city || !raw.address;

 if (hasReviewNotes || missingCritical) {
 needsReview.push(`${raw.sourceId} — ${raw.name}: ${raw.reviewNotes.join("; ") || "dados ausentes"}`);
 }

 const existing = existingBySourceId.get(raw.sourceId);

 if (existing) {
 // Se já tem coordenadas verificadas/manuais, preserva
 const preserveCoords =
 existing.geocodeStatus === "verified" || existing.geocodeStatus === "manual";

 if (preserveCoords) {
 toSkip++;
 console.log(` ⏭️ [${raw.sourceId}] ${raw.name} — preservado (coordenadas ${existing.geocodeStatus})`);
 } else {
 toUpdate++;
 console.log(` 🔄 [${raw.sourceId}] ${raw.name} — será atualizado`);
 }
 } else {
 toCreate++;
 console.log(` ➕ [${raw.sourceId}] ${raw.name} — será criado`);
 }
 }

 console.log(`\n📊 RESUMO:`);
 console.log(` Criar: ${toCreate}`);
 console.log(` Atualizar: ${toUpdate}`);
 console.log(` Preservar: ${toSkip}`);
 console.log(` Total: ${RAW_CELLS.length}`);

 if (needsReview.length > 0) {
 console.log(`\n⚠️ REGISTROS QUE PRECISAM DE REVISÃO (${needsReview.length}):`);
 for (const note of needsReview) {
 console.log(` • ${note}`);
 }
 }

 if (!confirm) {
 console.log(`\nℹ️ Modo preview. Para gravar, execute: npx tsx scripts/seed-cells.ts --confirm\n`);
 return;
 }

 // Gravação
 console.log(`\n💾 GRAVANDO NO FIRESTORE...\n`);
 const now = FieldValue.serverTimestamp();
 const batch = db.batch();
 let batchCount = 0;

 async function flushBatch() {
 if (batchCount > 0) {
 await batch.commit();
 console.log(` ✅ Batch de ${batchCount} operações salvo.`);
 batchCount = 0;
 }
 }

 for (const raw of RAW_CELLS) {
 const citySlug = normalizeCitySlug(raw.city);
 const hasReviewNotes = raw.reviewNotes.length > 0;
 const missingCritical = !raw.city || !raw.address;

 const existing = existingBySourceId.get(raw.sourceId);

 const payload: Record<string, unknown> = {
 name: raw.name,
 leaderName: raw.leaderName || "",
 neighborhood: raw.neighborhood || "",
 address: raw.address || "",
 dayTime: raw.dayTime,
 whatsapp: "",
 logoUrl: null,
 active: true,
 published: false,
 order: parseInt(raw.sourceId, 10),
 region: raw.region,
 profile: raw.profile,
 city: raw.city,
 citySlug,
 sedeId: null,
 meetingDay: raw.meetingDay,
 meetingTime: raw.meetingTime,
 latitude: null,
 longitude: null,
 geocodeStatus: "pending",
 reviewStatus: hasReviewNotes || missingCritical ? "needs_review" : "ok",
 addressPublic: false,
 locationPublic: false,
 sourceId: raw.sourceId,
 updatedAt: now,
 };

 if (existing) {
 const preserveCoords =
 existing.geocodeStatus === "verified" || existing.geocodeStatus === "manual";

 if (preserveCoords) {
 continue; // já contado como skip
 }

 // Atualiza sem sobrescrever coordenadas existentes
 delete payload.latitude;
 delete payload.longitude;
 delete payload.geocodeStatus;

 const ref = cellsRef.doc(existing._docId);
 batch.update(ref, payload);
 batchCount++;
 } else {
 const ref = cellsRef.doc();
 batch.set(ref, { ...payload, createdAt: now });
 batchCount++;
 }

 // Firestore batch limite: 500 ops
 if (batchCount >= 490) {
 await flushBatch();
 }
 }

 await flushBatch();
 console.log(`\n✅ Importação concluída!\n`);
}

main().catch((err) => {
 console.error("❌ Erro:", err);
 process.exit(1);
});