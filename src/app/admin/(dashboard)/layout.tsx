import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Segunda camada de verificação (além do proxy): garante que a página nunca
  // renderize dados sem uma sessão válida. `session.email` já vem decodificado
  // do cookie de sessão do Firebase Auth — não precisa de uma consulta extra
  // para descobrir quem é o admin (diferente do Prisma, que exigia buscar o
  // AdminUser pelo id guardado no JWT).
  const session = await getCurrentSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar adminEmail={session.email} />
      <main className="flex-1 overflow-x-hidden px-5 py-8 sm:px-10 sm:py-12">{children}</main>
    </div>
  );
}
