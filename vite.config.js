import { resolve } from 'node:path';

export default {
  base: '/signal/',
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), arena: resolve(__dirname, 'arena.html') },
    },
  },
};
