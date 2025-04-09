import { webcontainer } from "@/config/webContainer";
import { newBoltShellProcess, newShellProcess } from "@/services/shell";
import type { ITerminal } from "@repo/common/types";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

const reset = "\x1b[0m";

export const escapeCodes = {
  reset,
  clear: "\x1b[g",
  red: "\x1b[1;31m",
};

export const coloredText = {
  red: (text: string) => `${escapeCodes.red}${text}${reset}`,
};

export class TerminalStore {
  #webcontainer: Promise<WebContainer>;
  #terminals: Array<{ terminal: ITerminal; process: WebContainerProcess }> = [];
  #boltTerminal = newBoltShellProcess();

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;
  }
  get boltTerminal() {
    return this.#boltTerminal;
  }

  async attachBoltTerminal(terminal: ITerminal) {
    try {
      const wc = await this.#webcontainer;
      await this.#boltTerminal.init(wc, terminal);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      terminal.write(
        coloredText.red("Failed to spawn bolt shell\n\n") + errorMessage,
      );
      return;
    }
  }

  async attachTerminal(terminal: ITerminal) {
    try {
      const shellProcess = await newShellProcess(
        await this.#webcontainer,
        terminal,
      );
      this.#terminals.push({ terminal, process: shellProcess });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      terminal.write(
        coloredText.red("Failed to spawn shell\n\n") + errorMessage,
      );
      return;
    }
  }

  onTerminalResize(cols: number, rows: number) {
    for (const { process } of this.#terminals) {
      process.resize({ cols, rows });
    }
    this.#boltTerminal.process?.resize({ cols, rows });
  }
}

export const terminalStore = new TerminalStore(webcontainer);
