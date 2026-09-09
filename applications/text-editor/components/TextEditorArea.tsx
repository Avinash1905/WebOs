/**
 * @file TextEditorArea.tsx
 * @description Core multiline text editing area with line numbers, indentation, and cursor tracking.
 */

import React, { useRef, useEffect } from 'react';
import { useTextEditorStore } from '../store/textEditorStore.js';

export const TextEditorArea: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { tabs, activeTabId, preferences, updateContent, setCursorPos } = useTextEditorStore();

  const currentTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeTabId]);

  if (!currentTab) {
    return (
      <div className="te-empty-workspace">
        <div className="te-empty-text">No Document Open</div>
        <div className="te-empty-subtext">Click "New" or "Open" from the toolbar to start editing</div>
      </div>
    );
  }

  const lines = currentTab.content.split('\n');

  const handleSelectionChange = () => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const textUpToCursor = value.substring(0, selectionStart);
    const line = textUpToCursor.split('\n').length;
    const lastNewline = textUpToCursor.lastIndexOf('\n');
    const col = lastNewline === -1 ? selectionStart + 1 : selectionStart - lastNewline;
    setCursorPos(line, col);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd, value } = textarea;
      const indent = preferences.indentWithSpaces ? ' '.repeat(preferences.tabSize) : '\t';

      const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd);
      updateContent(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length;
      }, 0);
    }
  };

  const fontFamilyStyle =
    preferences.fontFamily === 'Monospace'
      ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      : preferences.fontFamily === 'Sans-Serif'
      ? 'system-ui, -apple-system, sans-serif'
      : 'Georgia, serif';

  return (
    <div className="te-editor-container">
      {/* Line Numbers Sidebar */}
      {preferences.lineNumbers && (
        <div className="te-line-numbers" style={{ fontSize: `${preferences.fontSize}px` }}>
          {lines.map((_, idx) => {
            const isCurrentLine = currentTab.cursorPos.line === idx + 1;
            return (
              <div key={idx} className={`te-line-number ${isCurrentLine ? 'active' : ''}`}>
                {idx + 1}
              </div>
            );
          })}
        </div>
      )}

      {/* Multiline Text Editor Area */}
      <div className="te-editor-wrapper">
        <textarea
          ref={textareaRef}
          className="te-textarea"
          style={{
            fontSize: `${preferences.fontSize}px`,
            fontFamily: fontFamilyStyle,
            whiteSpace: preferences.lineWrapping ? 'pre-wrap' : 'pre',
          }}
          value={currentTab.content}
          onChange={(e) => updateContent(e.target.value)}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          onKeyDown={handleKeyDown}
          readOnly={currentTab.readOnly}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
