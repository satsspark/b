import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        Unocss(),
    ],
    server: {
        host: 'localhost', //ip地址
        port: 3008, //端口号
        open: true //启动后是否自动打开浏览器
    },
    base: '/',
    build: {
        target: 'es2020', // 支持 BigInt 字面量
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    },
    esbuild: {
        target: 'es2020' // 确保 esbuild 也使用 es2020
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'es2020' // 依赖预构建也使用 es2020
        }
    }
})
