import { useEffect, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  CODE,
  HEADING,
  ORDERED_LIST,
  UNORDERED_LIST,
  QUOTE,
  LINK,
} from '@lexical/markdown'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { CodeNode } from '@lexical/code-core'
import { LinkNode } from '@lexical/link'
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, $isListNode } from '@lexical/list'
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical'

const TRANSFORMERS = [
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  CODE,
  HEADING,
  ORDERED_LIST,
  UNORDERED_LIST,
  QUOTE,
  LINK,
]

const theme = {
  text: {
    bold: 'lexical-bold',
    italic: 'lexical-italic',
    code: 'lexical-code',
    underline: 'lexical-underline',
  },
  heading: {
    h1: 'lexical-h1',
    h2: 'lexical-h2',
    h3: 'lexical-h3',
  },
  list: {
    ul: 'lexical-ul',
    ol: 'lexical-ol',
    listitem: 'lexical-li',
  },
  quote: 'lexical-quote',
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isBulletList, setIsBulletList] = useState(false)

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'))
          setIsItalic(selection.hasFormat('italic'))
          setIsCode(selection.hasFormat('code'))

          let node = selection.anchor.getNode()
          let inBulletList = false
          while (node !== null) {
            if ($isListNode(node) && node.getListType() === 'bullet') {
              inBulletList = true
              break
            }
            node = node.getParent() as typeof node
          }
          setIsBulletList(inBulletList)
        }
      })
    })
  }, [editor])

  const btnClass = (active: boolean) =>
    `px-2 py-0.5 rounded text-sm border transition-colors cursor-pointer select-none ${
      active
        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
        : 'border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-light)]'
    }`

  return (
    <div className="flex gap-1 pb-1.5 mb-1 border-b border-[var(--border)]">
      <button
        type="button"
        className={btnClass(isBold)}
        onMouseDown={e => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold') }}
        title="Fetstil (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        className={btnClass(isItalic)}
        onMouseDown={e => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic') }}
        title="Kursiv (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className={btnClass(isCode)}
        onMouseDown={e => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code') }}
        title="Kod"
      >
        {'</>'}
      </button>
      <button
        type="button"
        className={btnClass(isBulletList)}
        onMouseDown={e => {
          e.preventDefault()
          if (isBulletList) {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
          } else {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
        }}
        title="Punktlista"
      >
        •≡
      </button>
    </div>
  )
}

function OnChangePlugin({ onChange }: { onChange: (markdown: string) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS)
        onChange(markdown)
      })
    })
  }, [editor, onChange])
  return null
}

interface LexicalMarkdownEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  label?: string
}

export function LexicalMarkdownEditor({ value, onChange, placeholder, label }: LexicalMarkdownEditorProps) {
  const initialConfig = {
    namespace: 'TimeEntryEditor',
    theme,
    onError: (error: Error) => { throw error },
    nodes: [HeadingNode, QuoteNode, CodeNode, LinkNode, ListNode, ListItemNode],
    editorState: () => {
      $convertFromMarkdownString(value, TRANSFORMERS)
    },
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[var(--foreground-muted)]">{label}</label>
      )}
      <div className="lexical-editor-wrapper relative px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-card)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:border-transparent">
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin />
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-content" />}
            placeholder={<div className="editor-placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={onChange} />
        </LexicalComposer>
      </div>
    </div>
  )
}
