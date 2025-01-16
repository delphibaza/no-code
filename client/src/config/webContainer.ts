import { WebContainer } from '@webcontainer/api';

let webContainerInstance: WebContainer | null = null;

export const getWebContainer = async (): Promise<WebContainer> => {
    if (!webContainerInstance) {
        webContainerInstance = await WebContainer.boot();
    }
    return webContainerInstance;
};