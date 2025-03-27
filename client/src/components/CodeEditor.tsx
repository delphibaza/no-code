import { codeEditorOptions } from "@/config/codeEditorOptions";
import { getLanguageExtension, SupportedLanguages } from "@/lib/getLanguageExtension";
import { getLightOrDarkTheme } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { EditorView } from "@codemirror/view";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { Theme, useTheme } from "./ui/theme-provider";

function codeEditorTheme(theme: Theme) {
    const darkOrLight = getLightOrDarkTheme(theme);
    switch (darkOrLight) {
        case 'dark':
            return vscodeDark;
        case 'light':
            return vscodeLight;
        default:
            return vscodeDark;
    }
}
export function CodeEditor({ code, language = 'javascript', readonly }: {
    code: string,
    language?: SupportedLanguages,
    readonly: boolean
}) {
    const { theme } = useTheme();
    const { wordWrap } = useGeneralStore(
        useShallow(state => ({
            wordWrap: state.wordWrap
        }))
    );
    const { updateFile, selectedFile } = useFilesStore(
        useShallow(state => ({
            updateFile: state.updateFile,
            selectedFile: state.selectedFile
        }))
    );
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
            // TODO: fix height
            height="60vh"
            style={{
                fontSize: '12px',
            }}
            readOnly={readonly}
            theme={codeEditorTheme(theme)}
            extensions={[
                getLanguageExtension(language),
                ...(wordWrap ? [EditorView.lineWrapping] : [])
            ]}
            onChange={(value) => {
                if (selectedFile) {
                    updateFile(selectedFile, value);
                }
            }}
            basicSetup={codeEditorOptions}
        />
    )
}