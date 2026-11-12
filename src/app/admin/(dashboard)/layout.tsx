import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminCounts } from "@/lib/adminData";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  console.info("[admin/layout] iniciando validação de sessão");

  // Segunda camada de verificação (além do proxy): garante que a página nunca
  // renderize dados sem uma sessão válida. `session.email` já vem decodificado
  // do cookie de sessão do Firebase Auth — não precisa de uma consulta extra
  // para descobrir quem é o admin (diferente do Prisma, que exigia buscar o
  // AdminUser pelo id guardado no JWT).
  const session = await getCurrentSession();
  if (!session) {
    console.info("[admin/layout] sessão inválida, redirecionando para login");
    redirect("/admin/login");
  }
  console.info("[admin/layout] sessão validada com sucesso");

  let unreadSubmissions = 0;
  try {
    console.info("[admin/layout] iniciando getAdminCounts()");
    const counts = await getAdminCounts();
    unreadSubmissions = counts.unreadSubmissions;
    console.info("[admin/layout] getAdminCounts() concluído com sucesso");
  } catch (err) {
    console.error("[admin/layout] ERRO em getAdminCounts():", {
      name: (err as Error)?.name,
      message: (err as Error)?.message,
      stack: (err as Error)?.stack?.split("\n").slice(0, 5),
    });
    // Não bloqueia a renderização do layout se os contadores falharem
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar adminEmail={session.email} unreadSubmissions={unreadSubmissions} />
      <main className="flex-1 overflow-x-hidden px-5 py-8 sm:px-10 sm:py-12">{children}</main>
    </div>
  );
}
