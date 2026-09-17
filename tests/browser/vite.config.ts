import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    svelte({ configFile: false }),
    {
      name: 'ssr-test-fixture',
      configureServer(server) {
        server.middlewares.use('/ssr', async (_request, response, next) => {
          try {
            const { renderFixture } = await server.ssrLoadModule('/server.ts')
            response.setHeader('Content-Type', 'text/html')
            response.end(renderFixture())
          } catch (error) {
            next(error)
          }
        })
      },
    },
  ],
  resolve: { dedupe: ['svelte'] },
})
