import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
// Problematische ES-Module durch CommonJS-Importe ersetzen
// import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
// import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';

// Initialize lowlight and register common languages for syntax highlighting
const lowlight = createLowlight();
lowlight.register('javascript', js);
lowlight.register('typescript', ts);
lowlight.register('css', css);
// Problematische Sprachen entfernt
lowlight.register('json', json);
// SQL entfernt
lowlight.register('bash', bash);

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      CodeBlockLowlight.configure({ lowlight }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder || 'Schreiben Sie Ihren Beitrag…' }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-indigo max-w-none min-h-[200px] focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Keep editor in sync if external value changes (e.g., when loading existing post)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== undefined && value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const handleImageButton = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || 'Upload failed');
      }
      const data = await resp.json();
      const url = data.url as string;
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error('Image upload failed', err);
      alert('Bild-Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link-URL eingeben', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const unsetLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addRow = useCallback(() => editor?.chain().focus().addRowAfter().run(), [editor]);
  const addColumn = useCallback(() => editor?.chain().focus().addColumnAfter().run(), [editor]);
  const deleteRow = useCallback(() => editor?.chain().focus().deleteRow().run(), [editor]);
  const deleteColumn = useCallback(() => editor?.chain().focus().deleteColumn().run(), [editor]);
  const deleteTable = useCallback(() => editor?.chain().focus().deleteTable().run(), [editor]);

  if (!editor) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border border-gray-200 bg-gray-50 rounded-t-md p-2">
        <select
          className="border rounded px-2 py-1 text-sm"
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'paragraph') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v) as 1|2|3|4|5|6 }).run();
          }}
          defaultValue="paragraph"
        >
          <option value="paragraph">Absatz</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
          <option value="4">H4</option>
          <option value="5">H5</option>
          <option value="6">H6</option>
        </select>

        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >Fett</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >Kursiv</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >Durchgestr.</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >Unterstr.</button>

        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >• Liste</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >1. Liste</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
        >Einzug</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
        >Ausrücken</button>
        
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >Zitat</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >Linie</button>

        <div className="flex items-center gap-1 ml-2">
          <button type="button" className="px-2 py-1 text-sm border rounded"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >Links</button>
          <button type="button" className="px-2 py-1 text-sm border rounded"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >Zentriert</button>
          <button type="button" className="px-2 py-1 text-sm border rounded"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >Rechts</button>
          <button type="button" className="px-2 py-1 text-sm border rounded"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >Blocksatz</button>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <label className="text-xs text-gray-600">Textfarbe</label>
          <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
          <button type="button" className="px-2 py-1 text-sm border rounded"
            onClick={() => editor.chain().focus().unsetColor().run()}
          >Entf.</button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Markieren</label>
          <input type="color" onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()} />
          <button type="button" className="px-2 py-1 text-sm border rounded"
            onClick={() => {
              if (editor.isActive('highlight')) editor.chain().focus().toggleHighlight().run();
            }}
          >Entf.</button>
        </div>

        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >Code</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >Codeblock</button>

        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={setLink}
        >Link</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={unsetLink}
        >Link entf.</button>

        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={handleImageButton} disabled={isUploading}
        >{isUploading ? 'Bild...' : 'Bild'}</button>

        <div className="flex items-center gap-1 ml-2">
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={insertTable}>Tabelle</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={addRow}>+Zeile</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={addColumn}>+Spalte</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={deleteRow}>-Zeile</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={deleteColumn}>-Spalte</button>
          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={deleteTable}>Tabelle löschen</button>
        </div>

        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >Formatierung löschen</button>

        <button type="button" className="ml-auto px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().undo().run()}
        >Rückg.</button>
        <button type="button" className="px-2 py-1 text-sm border rounded"
          onClick={() => editor.chain().focus().redo().run()}
        >Wiederh.</button>
      </div>

      <div className="border border-t-0 rounded-b-md p-3 bg-white">
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
          <div className="flex gap-1 bg-white border rounded shadow p-1">
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
            <button className="px-2 py-1 text-sm border rounded" onClick={setLink}>Link</button>
          </div>
        </BubbleMenu>

        <FloatingMenu editor={editor} tippyOptions={{ duration: 150 }} shouldShow={({ editor }) => editor.isActive('paragraph') && editor.state.selection.empty}>
          <div className="flex gap-1 bg-white border rounded shadow p-1">
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleBulletList().run()}>• Liste</button>
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Liste</button>
            <button className="px-2 py-1 text-sm border rounded" onClick={() => editor.chain().focus().toggleBlockquote().run()}>Zitat</button>
          </div>
        </FloatingMenu>
        <EditorContent editor={editor} />
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
