"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function MenuBar({ editor }: { editor: Editor | null }) {
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("bold") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("italic") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("bulletList") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("orderedList") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("link") && "bg-muted")}
        onClick={setLink}
      >
        <LinkIcon className="size-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="size-4" />
      </Button>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "",
  disabled = false,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div
      className={cn(
        "border rounded-md overflow-hidden",
        disabled && "opacity-50",
        className
      )}
    >
      {!disabled && <MenuBar editor={editor} />}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none p-3 min-h-[150px] focus-within:outline-none",
          "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[120px]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
        )}
      />
    </div>
  );
}

// Read-only renderer for displaying saved HTML content
interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  if (!content || content === "<p></p>") {
    return null;
  }

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "[&_a]:text-primary [&_a]:underline",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
