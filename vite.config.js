import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                // Vitrin (müşteri tarafı)
                'resources/scss/front.scss',
                'resources/js/front.js',
                // Yönetim paneli
                'resources/scss/admin.scss',
                'resources/js/admin.js',
            ],
            refresh: true,
        }),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                // Bootstrap 5.3 Sass'ı henüz yeni modül sistemine geçmedi
                silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'mixed-decls'],
            },
        },
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
