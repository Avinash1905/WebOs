import React, { useRef, useEffect } from 'react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';
import { tokenizeLine } from '../utils/syntaxHighlighter.js';
import type { CodeEditorTab } from '../types.js';

interface EditorAreaProps {
  tab: CodeEditorTab;
}

export const EditorArea: React.FC<EditorAreaProps> = ({ tab }) => {
  const { updateActiveContent, setCursorPos, settings } = useCodeEditorStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const lines = tab.content.split('\n');

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;
    const textBefore = text.substring(0, selStart);
    const lineNum = textBefore.split('\n').length;
    const colNum = selStart - textBefore.lastIndexOf('\n');
    setCursorPos(lineNum, colNum);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Auto bracket / quote pairing
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key] && textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start === end) {
        e.preventDefault();
        const closing = pairs[e.key]!;
        const newText =
          tab.content.substring(0, start) + e.key + closing + tab.content.substring(end);
        updateActiveContent(newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 1;
            textareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
      }
    }
  };

  return (
    <div
      className="editor-area-canvas"
      style={{
        fontSize: `${settings.fontSize}px`,
        fontFamily: settings.fontFamily,
      }}
    >
      {/* Line Numbers Column */}
      {settings.showLineNumbers && (
        <div className="line-numbers-col">
          {lines.map((_, idx) => (
            <div
              key={idx}
              className={`line-number ${tab.cursorPos.line === idx + 1 ? 'active-line-num' : ''}`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      )}

      {/* Syntax Highlight Overlay & Textarea Wrapper */}
      <div className="editor-text-wrapper">
        <div className="syntax-highlight-overlay" ref={highlightRef}>
          {lines.map((line, lineIdx) => {
            const tokens = tokenizeLine(line, tab.language);
            const isCurrentLine = tab.cursorPos.line === lineIdx + 1;

            return (
              <div
                key={lineIdx}
                className={`syntax-line ${isCurrentLine ? 'active-syntax-line' : ''}`}
              >
                {tokens.map((token, tokIdx) => (
                  <span key={tokIdx} className={`token token-${token.type}`}>
                    {token.text}
                  </span>
                ))}
                {line.length === 0 && <br />}
              </div>
            );
          })}
        </div>

        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={tab.content}
          onChange={(e) => updateActiveContent(e.target.value)}
          onScroll={handleScroll}
          onClick={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
