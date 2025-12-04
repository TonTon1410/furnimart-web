"use client"

import { useRef } from "react"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css";


interface BlogEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function BlogEditor({ value, onChange, placeholder }: BlogEditorProps) {
  const quillRef = useRef<ReactQuill>(null)

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      [{ align: [] }],
      ["link", "image"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  }

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "blockquote",
    "code-block",
    "align",
    "link",
    "image",
    "color",
    "background",
  ]

  return (
    <div className="w-full">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background text-foreground rounded-lg border border-border focus-within:ring-2 focus-within:ring-accent focus-within:border-accent"
      />
      <style>{`
        .ql-toolbar {
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 0.5rem 0.5rem 0 0;
          background-color: var(--card, #ffffff);
        }
        .ql-container {
          border: none;
          border-radius: 0 0 0.5rem 0.5rem;
          min-height: 300px;
          background-color: var(--background, #fafafa);
          font-size: 0.875rem;
        }
        .ql-editor {
          min-height: 300px;
          color: var(--foreground, #000000);
          padding: 1rem;
        }
        .ql-editor.ql-blank::before {
          color: var(--muted-foreground, #999999);
          font-style: italic;
        }
        .ql-toolbar.ql-snow .ql-stroke {
          stroke: var(--foreground, #000000);
        }
        .ql-toolbar.ql-snow .ql-fill {
          fill: var(--foreground, #000000);
        }
        .ql-toolbar.ql-snow .ql-picker-label {
          color: var(--foreground, #000000);
        }
      `}</style>
    </div>
  )
}
