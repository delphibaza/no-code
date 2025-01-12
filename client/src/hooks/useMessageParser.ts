import type { Message } from 'ai';
import { useCallback, useState } from 'react';
import { StreamingMessageParser } from '@/lib/StreamingMessageParser';

const messageParser = new StreamingMessageParser({
    callbacks: {
        onArtifactOpen: (data) => {
            //   workbenchStore.showWorkbench.set(true);
            //   workbenchStore.addArtifact(data);
            console.log("onArtifactOpen", data);

        },
        onArtifactClose: (data) => {
            // workbenchStore.updateArtifact(data, { closed: true });
            console.log("onActionOpen", data);
        },
        onActionOpen: (data) => {
            // we only add shell actions when when the close tag got parsed because only then we have the content
            // if (data.action.type !== 'shell') {
            //     workbenchStore.addAction(data);
            // }
            console.log("onActionOpen", data);
        },
        onActionClose: (data) => {
            // if (data.action.type === 'shell') {
            //     workbenchStore.addAction(data);
            // }
            // workbenchStore.runAction(data);
            console.log("onActionClose", data);
        },
    },
});

export function useMessageParser() {
    const [parsedMessages, setParsedMessages] = useState<{ [key: number]: string }>({});

    const parseMessages = useCallback((messages: Message[], isLoading: boolean) => {
        let reset = false;

        if (!isLoading) {
            reset = true;
            messageParser.reset();
        }

        for (const [index, message] of messages.entries()) {
            if (message.role === 'assistant') {
                const newParsedContent = messageParser.parse(message.id, message.content);

                setParsedMessages(prevParsed => ({
                    ...prevParsed,
                    [index]: !reset ? (prevParsed[index] || '') + newParsedContent : newParsedContent,
                }));
            }
        }
    }, []);

    return { parsedMessages, parseMessages };
}