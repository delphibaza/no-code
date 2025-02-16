import { cwd } from '@repo/common/types';
import { WebContainer } from '@webcontainer/api';

let webContainerInstance: WebContainer | null = null;

export const getWebContainer = async (): Promise<WebContainer> => {
    if (!webContainerInstance) {
        webContainerInstance = await WebContainer.boot({
            workdirName: cwd
        });
    }
    return webContainerInstance;
};