/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // HTTPS no servidor de desenvolvimento, ligado por `VITE_HTTPS=true`.
  //
  // Só é preciso para uma coisa: a câmara. Os navegadores só dão acesso à câmara em
  // contextos seguros — HTTPS, ou `localhost`. Num endereço de rede local em `http://`,
  // `navigator.mediaDevices` simplesmente não existe, pelo que o leitor de códigos de
  // barras não pode arrancar no telemóvel sem isto.
  //
  // Fica desligado por omissão porque o certificado é auto-assinado: o navegador mostra
  // um aviso que é preciso aceitar à mão, o que não se quer no arranque normal.
  //
  //   VITE_HTTPS=true npm run dev
  const comHttps = env.VITE_HTTPS === 'true'

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(comHttps ? [basicSsl()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT || '5273'),
      strictPort: true,
      // `host: true` escuta em todas as interfaces de rede, não só em `localhost`.
      //
      // Sem isto, o telemóvel do operador de caixa não consegue abrir o sistema: está
      // noutro dispositivo, e `localhost` no telemóvel é o próprio telemóvel. Com isto,
      // o Vite passa a anunciar também o endereço de rede ao arrancar, que é o que se
      // escreve no navegador do telemóvel.
      //
      // Nota sobre a câmara: os navegadores só dão acesso à câmara em contextos seguros
      // — HTTPS, ou `localhost`. Num endereço `http://192.168.x.x` o leitor de códigos
      // não arranca, mesmo com esta opção. Para experimentar no telemóvel em
      // desenvolvimento, ver o `README` na secção de acesso móvel.
      host: true,

      // Encaminha os pedidos da API pelo próprio servidor de desenvolvimento.
      //
      // Resolve o encadeado que o HTTPS cria: uma página em HTTPS não pode chamar uma API
      // em HTTP (conteúdo misto, bloqueado pelo browser), e pôr o NestJS em HTTPS só para
      // desenvolver seria trabalho a mais. Encaminhados, os dois partilham origem — e
      // portanto o mesmo certificado — e o browser não vê nada misto.
      //
      // Activa-se apontando a API para um caminho relativo:
      //   VITE_API_URL=/api/v1  VITE_HTTPS=true  npm run dev
      proxy: {
        '/api': {
          target: `http://localhost:${env.API_PORT || '3100'}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      // Ambiente Node por defeito: os testes actuais cobrem lógica pura (stores,
      // cálculos). Testes de componentes exigirão jsdom e @testing-library/react.
      environment: 'node',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})


