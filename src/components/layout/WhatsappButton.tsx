import Image from "next/image";
import { whatsappUrl } from "@/lib/site";

/**
 * Botão flutuante do WhatsApp fixo no canto inferior direito da tela.
 * Usa a imagem personalizada da pasta de assets e linka diretamente
 * para o número oficial da igreja via wa.me.
 */
export function WhatsappButton({ phoneE164 }: { phoneE164: string }) {
  const href = whatsappUrl(phoneE164, "Olá! Gostaria de entrar em contato com a Igreja Amor e Cuidado.");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-50 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:bottom-8 sm:right-8"
    >
      <Image
        src="/assets/whatsapplogo.jpg"
        alt=""
        width={60}
        height={60}
        className="h-14 w-14 rounded-full shadow-lg sm:h-16 sm:w-16"
        priority={false}
      />
    </a>
  );
}