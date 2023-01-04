import path from 'path'

import connect from 'electron-connect'
import gulp from 'gulp'
import { watch } from 'rollup'

import libConfigs from '../rollup.config.mjs'
import { distDir } from './constants.mjs'
import exampleConfigs from './rollup.config.mjs'

const electron = connect.server.create();
const args = [path.join(distDir, 'main.js')];

function watchCompile(configs) {
    const watcher = watch(configs);
    let started = false;
    watcher.on('event', (event) => {
        if (/error/i.test(event.code)) {
            console.error(event);
        }
        if (event.code === 'END' && !started) {
            // Start browser process
            electron.start(args);
            // Restart browser process
            gulp.watch([
                '**/*',
                '!renderer/**/*'
            ], { cwd: distDir }, (done) => {
                electron.restart(args, (state) => {
                    if (state === 'restarted') {
                        done();
                    }
                });
            });
            // Reload renderer process
            gulp.watch([
                'renderer/**/*',
            ], { cwd: distDir }, (done) => {
                electron.reload();
                // 3000ms is hard coded in electron-connect
                setTimeout(done, 3000);
            });
            started = true;
        }
    });
}

watchCompile([...libConfigs, ...exampleConfigs])
