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
        for (const [route, renderer] of [
          ['/ssr-react', 'renderReactFixture'],
          ['/ssr', 'renderFixture'],
        ] as const)
          server.middlewares.use(route, async (_request, response, next) => {
            try {
              const fixtures = await server.ssrLoadModule('/server.ts')
              response.setHeader('Content-Type', 'text/html')
              response.end(fixtures[renderer]())
            } catch (error) {
              next(error)
            }
          })
      },
    },
  ],
  resolve: { dedupe: ['svelte'] },
})
