const isDev = process.env.NODE_ENV === "development";

/**
 * CSP sem nonce, de propósito: a maioria das páginas do site é estática
 * (bom para Core Web Vitals — ver Route summary do `next build`), e nonces
 * só funcionam em páginas dinamicamente renderizadas (páginas estáticas são
 * geradas em build time, sem request/response para injetar um nonce por
 * requisição). 'unsafe-inline' em script-src cobre o payload de hidratação
 * que o Next embute inline nas páginas estáticas; 'unsafe-eval' só em dev
 * porque o React usa eval() para reconstruir stack traces de erro do
 * servidor no navegador (nunca em produção).
 * Ver: node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
 */
const cspHeader = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Framer Motion anima via inline style (element.style.*) em runtime.
  `style-src 'self' 'unsafe-inline'`,
  // Uploads do admin (hero, galeria, avisos, logos de célula) ficam em
  // public/uploads/ — mesma origem do site, cobertos por 'self'. i.ytimg.com:
  // thumbnails das mensagens, servidas pelo próprio YouTube — evita hospedar
  // cópia das capas.
  `img-src 'self' data: blob: https://i.ytimg.com`,
  `media-src 'self'`,
  `font-src 'self'`,
  `connect-src 'self'`,
  // youtube-nocookie.com: vídeo de fundo do Hero quando a igreja usa um link
  // do YouTube em vez de enviar um arquivo (ver
  // src/components/home/HeroYoutubeBackground.tsx) — domínio de privacidade
  // reforçada do próprio YouTube, sem cookie de rastreamento até haver
  // interação com o player.
  `frame-src https://www.youtube-nocookie.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Uploads do admin são servidos de /uploads/** (mesma origem, disco local
    // — ver src/lib/upload.ts), então não precisam de remotePattern. Só
    // i.ytimg.com (thumbnails do YouTube nas mensagens) é remoto.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
  async redirects() {
    return [
      // /doacoes virou /contribua no rebrand — a rota antiga pode estar
      // impressa em material da igreja e indexada, então segue viva.
      { source: "/doacoes", destination: "/contribua", permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      // Vídeo do hero permite até 60MB (ver MAX_VIDEO_BYTES em src/lib/upload.ts);
      // a margem cobre o overhead do multipart e os demais campos do formulário.
      bodySizeLimit: "65mb",
    },
    // proxy.ts (src/proxy.ts) roda em toda rota /admin/**: o Next.js clona e
    // buferiza o corpo da requisição para permitir múltiplas leituras (aqui e
    // no route handler), com limite padrão de 10MB — bem abaixo do vídeo do
    // hero. Sem isso, o upload é truncado no meio do multipart e quebra com
    // "Unexpected end of form" antes mesmo de chegar na Server Action.
    proxyClientMaxBodySize: "65mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
