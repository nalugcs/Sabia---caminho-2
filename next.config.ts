import type { NextConfig } from "next";

// Headers de segurança — Fase A (docs/security/SECURITY.md § 2.3).
// App 100% same-origin: fontes locais (next/font/local), sem CDNs, sem imagens
// externas. As APIs de IA (Gemini/Groq) são chamadas server-side — a CSP não
// precisa liberá-las no connect-src do navegador.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    // 'unsafe-inline' em script/style: exigido pelo runtime do Next sem nonce
    // (hidratação injeta scripts inline). Etapa futura: nonce via middleware.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
