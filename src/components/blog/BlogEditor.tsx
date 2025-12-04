"use client"

import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"
import "./BlogEditor.css"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

interface BlogEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export function BlogEditor({ value, onChange, placeholder = "Viết nội dung blog của bạn..." }: BlogEditorProps) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  }

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "code-block",
    "list",
    "bullet",
    "link",
    "image",
  ]

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background text-foreground rounded-lg overflow-hidden"
      />
      <style>{`
        .quill-editor-wrapper .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .quill-editor-wrapper .ql-editor {
          min-height: 240px;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .quill-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: hsl(var(--muted));
          border-color: hsl(var(--border));
        }
        .quill-editor-wrapper .ql-stroke {
          stroke: hsl(var(--foreground)) !important;
        }
        .quill-editor-wrapper .ql-fill {
          fill: hsl(var(--foreground)) !important;
        }
        .quill-editor-wrapper .ql-picker-label {
          color: hsl(var(--foreground)) !important;
        }
      `}</style>
    </div>
  )
}
