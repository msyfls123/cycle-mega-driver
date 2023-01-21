import { mergeWithKey } from 'cycle-mega-driver/lib/main';
import { IpcRendererSource, makeIpcRendererDriverNg } from 'cycle-mega-driver/lib/renderer'
import { ChannelConfigToSink } from 'cycle-mega-driver/lib/utils/observable';
import { contextBridge } from 'electron';
import { Observable, Subject } from 'rxjs';

import run from '@cycle/rxjs-run';

import { IPCMainConfig, IPCRendererConfig } from './constants';

const main = (
    { ipc }:
    { ipc: IpcRendererSource<IPCRendererConfig, IPCMainConfig> }
): {
    ipc: Observable<ChannelConfigToSink<IPCRendererConfig>>
} => {
    const blur$ = new Subject<boolean>
    contextBridge.exposeInMainWorld('mega', {
        blur: () => {
            blur$.next(false)
        },
        subscribeVisible: (cb) => {
            ipc.select('visible').subscribe(cb)
        }
    })
    return {
        ipc: mergeWithKey({
            'toggle-focus': blur$,
        })
    }
}

run(main, {
    ipc: makeIpcRendererDriverNg<IPCRendererConfig, IPCMainConfig>(),
})
