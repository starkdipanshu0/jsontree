'use client';

import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Check, FileText, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/store/hooks';
import debounce from 'lodash.debounce';
import { parseJson, setJsonText } from '@/redux/json/slice';

type Props = {
  initialValue?: string;
  onChange?: (value: string) => void;
};

const DEFAULT_JSON = '{\n  "name": "Example",\n  "children": []\n}';

export default function EditorPanel({ initialValue = DEFAULT_JSON, onChange }: Props) {
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const dispatch = useAppDispatch();
  const jsonText = useAppSelector((s) => s.jsonTree?.jsonText ?? initialValue);

  // responsive editor font size (adjusts with container width)
  const [fontSize, setFontSize] = useState<number>(13);

  useEffect(() => {
    setMounted(true);
  }, []);

  // derive monaco theme name from next-themes
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const monacoTheme = currentTheme === 'dark' ? 'hc-black' : 'vs';

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    const start = jsonText ?? initialValue;
    if (start && editor.getValue() !== start) editor.setValue(start);

    // apply initial responsive options
    editor.updateOptions({
      fontSize,
    });
  };

  // Keep editor content in sync if jsonText changes externally
  useEffect(() => {
    if (!editorRef.current) return;
    const cur = editorRef.current.getValue();
    if (jsonText !== undefined && jsonText !== null && jsonText !== cur) {
      const selection = editorRef.current.getSelection();
      editorRef.current.setValue(jsonText);
      if (selection) {
        try {
          editorRef.current.setSelection(selection);
        } catch { }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonText]);

  // update editor options when fontSize or theme changes
  useEffect(() => {
    if (!editorRef.current) return;
    try {
      editorRef.current.updateOptions({
        fontSize,
      });
    } catch { }
  }, [fontSize, monacoTheme]);

  // ResizeObserver to update font size responsively (container-based)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        // simple thresholds — tweak as needed
        if (w < 420) {
          setFontSize(12);
        } else if (w < 640) {
          setFontSize(13);
        } else if (w < 1024) {
          setFontSize(14);
        } else {
          setFontSize(15);
        }
      }
    });

    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Debounced parse dispatch (300ms)
  const debouncedParse = useRef(
    debounce(() => {
      dispatch(parseJson());
    }, 300),
  );

  useEffect(() => {
    return () => {
      debouncedParse.current.cancel();
    };
  }, []);

  const getValue = () => editorRef.current?.getValue() ?? '';

  const setValue = (val: string) => {
    if (editorRef.current) editorRef.current.setValue(val);
    if (onChange) onChange(val);
    // update redux
    dispatch(setJsonText(val));
    // schedule parse
    debouncedParse.current();
  };

  const handleFormat = () => {
    const value = getValue();
    try {
      const parsed = JSON.parse(value);
      const pretty = JSON.stringify(parsed, null, 2);
      setValue(pretty);
    } catch (err: any) {
      // lightweight feedback — replace with your toast if available
      window.alert('Invalid JSON: ' + err.message);
    }
  };

  const handleValidate = () => {
    const value = getValue();
    try {
      JSON.parse(value);
      window.alert('Valid JSON');
    } catch (err: any) {
      window.alert('Invalid JSON: ' + err.message);
    }
  };

  const handleClear = () => {
    if (!editorRef.current) return;
    if (confirm('Clear editor content?')) {
      setValue('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background/60">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">Input</div>
          <div className="text-xs text-muted-foreground">Paste JSON here</div>
        </div>

        {/* Controls wrap on small screens */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFormat}
            title="Format JSON"
            className="flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Format</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            title="Validate JSON"
            className="flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Validate</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            title="Clear editor"
            className="flex items-center"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden min-h-0" ref={wrapperRef}>
        {mounted ? (
          <Editor
            height="100%"
            defaultLanguage="json"
            defaultValue={jsonText ?? initialValue}
            theme={monacoTheme}
            onMount={handleEditorMount}
            options={{
              fontSize,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
              // accessibility: show inline hints etc only on larger screens
              glyphMargin: true,
            }}
            onChange={(val) => {
              if (typeof val === 'string') {
                // immediate update to redux + debounced parse
                dispatch(setJsonText(val));
                debouncedParse.current();
                if (onChange) onChange(val);
              }
            }}
          />
        ) : (
          // server-friendly placeholder until mounted
          <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground p-4">
            Loading editor...
          </div>
        )}
      </div>
    </div>
  );
}
