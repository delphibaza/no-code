import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { javascript } from '@codemirror/lang-javascript';
import { vscodeLight, vscodeDark } from "@uiw/codemirror-theme-vscode";
import { useTheme } from "./ui/theme-provider";
import { codeEditorOptions } from "@/config/codeEditorOptions";
import { useEffect, useRef } from "react";

export function CodeEditor({ code }: {
    code: string,
    // setCode: React.Dispatch<React.SetStateAction<string>>
}) {
    const { theme } = useTheme();
    const editorRef = useRef<ReactCodeMirrorRef>(null);

    useEffect(() => {
        if (editorRef.current) {
            const editor = editorRef.current.view;
            if (editor) {
                const scrollInfo = editor.scrollDOM.scrollHeight;
                editor.scrollDOM.scrollTo(0, scrollInfo);
            }
        }
    }, [code]);

    return (
        <CodeMirror
            ref={editorRef}
            value={code}
            height="65vh"
            style={{
                fontSize: '12px'
            }}
            theme={theme === 'dark' ? vscodeDark : vscodeLight}
            extensions={[javascript({ jsx: true, typescript: true })]}
            // onChange={(val, viewUpdate) => {
            // setCode(val);
            // }}
            basicSetup={codeEditorOptions}
        />
    )
}