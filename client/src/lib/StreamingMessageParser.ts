import { ActionType, BoltAction, BoltArtifactData, File, FileAction, MessageState, ShellAction, StreamingMessageParserOptions } from "@repo/common/types";

const ARTIFACT_TAG_OPEN = '<boltArtifact';
const ARTIFACT_TAG_CLOSE = '</boltArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<boltAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</boltAction>';

export class StreamingMessageParser {
    #messages = new Map<string, MessageState>();
    static readonly filesMap = new Map<string, File[]>(); // New Map to store files for each messageId

    constructor(private _options: StreamingMessageParserOptions = {}) { }

    parse(messageId: string, input: string) {
        let state = this.#messages.get(messageId);

        if (!state) {
            state = {
                position: 0,
                insideAction: false,
                insideArtifact: false,
                currentAction: { content: '' },
                actionId: 0,
            };

            this.#messages.set(messageId, state);
        }

        let output = '';
        let i = state.position;
        let earlyBreak = false;

        // Ensure the files array exists for the messageId
        if (!StreamingMessageParser.filesMap.has(messageId)) {
            StreamingMessageParser.filesMap.set(messageId, []);
        }

        while (i < input.length) {
            if (state.insideArtifact) {
                const currentArtifact = state.currentArtifact;

                if (currentArtifact === undefined) {
                    throw new Error(`Unreachable: Artifact not initialized`);
                }

                if (state.insideAction) {
                    const currentAction = state.currentAction;

                    // Append content to the current file if action type is `file`
                    if ('type' in currentAction && currentAction.type === 'file') {
                        const filePath = (currentAction as FileAction).path;

                        // Get or create the file object
                        let currentFile = StreamingMessageParser.filesMap
                            .get(messageId)
                            ?.find(file => file.path === filePath);

                        if (!currentFile) {
                            currentFile = { path: filePath, content: '' };
                            StreamingMessageParser.filesMap.get(messageId)?.push(currentFile);
                        }
                        // Append content to the file
                        currentFile.content += input[i];
                        // Remove the code block tags from the content
                        const removableContent = ['```typescript', '```js', '```javascript', '```jsx', '```tsx', '```xml', '```'];
                        for (const content of removableContent) {
                            if (currentFile.content.includes(content)) {
                                currentFile.content = currentFile.content.replace(content, '');
                            }
                        }
                        // Add the remaining content to the file if the action closing tag is found
                        const closeIndex = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i);
                        if (closeIndex !== -1) {
                            currentFile.content += input.slice(i, closeIndex);
                            for (const content of removableContent) {
                                if (currentFile.content.includes(content)) {
                                    currentFile.content = currentFile.content.replace(content, '');
                                }
                            }
                        }
                    }

                    const closeIndex = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i);

                    if (closeIndex !== -1) {
                        state.insideAction = false;
                        state.currentAction = { content: '' };

                        i = closeIndex + ARTIFACT_ACTION_TAG_CLOSE.length;

                        // Trigger the callback if present
                        this._options.callbacks?.onActionClose?.({
                            artifactId: currentArtifact.id,
                            messageId,
                            actionId: String(state.actionId - 1),
                            action: currentAction as BoltAction,
                        });
                    } else {
                        i++;
                        continue;
                    }
                } else {
                    const actionOpenIndex = input.indexOf(ARTIFACT_ACTION_TAG_OPEN, i);
                    const artifactCloseIndex = input.indexOf(ARTIFACT_TAG_CLOSE, i);

                    if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
                        const actionEndIndex = input.indexOf('>', actionOpenIndex);

                        if (actionEndIndex !== -1) {
                            state.insideAction = true;

                            state.currentAction = this.#parseActionTag(input, actionOpenIndex, actionEndIndex);

                            this._options.callbacks?.onActionOpen?.({
                                artifactId: currentArtifact.id,
                                messageId,
                                actionId: String(state.actionId++),
                                action: state.currentAction as BoltAction,
                            });

                            i = actionEndIndex + 1;
                        } else {
                            break;
                        }
                    } else if (artifactCloseIndex !== -1) {
                        this._options.callbacks?.onArtifactClose?.({ messageId, ...currentArtifact });

                        state.insideArtifact = false;
                        state.currentArtifact = undefined;

                        i = artifactCloseIndex + ARTIFACT_TAG_CLOSE.length;
                    } else {
                        break;
                    }
                }
            } else if (input[i] === '<' && input[i + 1] !== '/') {
                let j = i;
                let potentialTag = '';

                while (j < input.length && potentialTag.length < ARTIFACT_TAG_OPEN.length) {
                    potentialTag += input[j];

                    if (potentialTag === ARTIFACT_TAG_OPEN) {
                        const nextChar = input[j + 1];

                        if (nextChar && nextChar !== '>' && nextChar !== ' ') {
                            output += input.slice(i, j + 1);
                            i = j + 1;
                            break;
                        }

                        const openTagEnd = input.indexOf('>', j);

                        if (openTagEnd !== -1) {
                            const artifactTag = input.slice(i, openTagEnd + 1);

                            const artifactTitle = this.#extractAttribute(artifactTag, 'title') as string;
                            const artifactId = this.#extractAttribute(artifactTag, 'id') as string;

                            if (!artifactTitle) {
                                console.warn('Artifact title missing');
                            }

                            if (!artifactId) {
                                console.warn('Artifact id missing');
                            }

                            state.insideArtifact = true;

                            const currentArtifact = {
                                id: artifactId,
                                title: artifactTitle,
                            } satisfies BoltArtifactData;

                            state.currentArtifact = currentArtifact;

                            this._options.callbacks?.onArtifactOpen?.({ messageId, ...currentArtifact });

                            i = openTagEnd + 1;
                        } else {
                            earlyBreak = true;
                        }

                        break;
                    } else if (!ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
                        output += input.slice(i, j + 1);
                        i = j + 1;
                        break;
                    }

                    j++;
                }

                if (j === input.length && ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
                    break;
                }
            } else {
                output += input[i];
                i++;
            }

            if (earlyBreak) {
                break;
            }
        }

        state.position = i;

        return output;
    }

    reset() {
        this.#messages.clear();
        StreamingMessageParser.filesMap.clear();
    }

    #parseActionTag(input: string, actionOpenIndex: number, actionEndIndex: number) {
        const actionTag = input.slice(actionOpenIndex, actionEndIndex + 1);

        const actionType = this.#extractAttribute(actionTag, 'type') as ActionType;

        const actionAttributes = {
            type: actionType,
            content: '',
        };

        if (actionType === 'file') {
            const filePath = this.#extractAttribute(actionTag, 'filePath') as string;

            if (!filePath) {
                console.log('File path not specified');
            }

            (actionAttributes as FileAction).path = filePath;
        } else if (actionType !== 'shell') {
            console.warn(`Unknown action type '${actionType}'`);
        }

        return actionAttributes as FileAction | ShellAction;
    }

    #extractAttribute(tag: string, attributeName: string): string | undefined {
        const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
        return match ? match[1] : undefined;
    }
}