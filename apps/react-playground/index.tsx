import { serve } from 'bun'
import index from './index.html'

const port = process.env.PORT || 3041

serve({
  port: port,
  routes: {
    '/*': index,
  },
})

console.log(`🚀 Server running at http://localhost:${port}`)
