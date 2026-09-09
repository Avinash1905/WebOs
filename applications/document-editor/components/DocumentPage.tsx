/**
 * @file DocumentPage.tsx
 * @description Page view component rendering structured document blocks inside page margins.
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { useDocumentEditorStore } from '../store/documentEditorStore.js';
import { DocumentTableEditor } from './DocumentTableEditor.js';
import type { DocBlock, DocParagraph, DocHeading, DocList } from '../types.js';

export const DocumentPage: React.FC = () => {
  const {
    document,
    selectedBlockId,
    selectedRunId,
    updateTextRun,
    selectBlock,
    deleteBlock,
  } = useDocumentEditorStore();

  const section = document.sections[0]!;

  const renderBlock = (block: DocBlock) => {
    const isSelected = selectedBlockId === block.id;

    if (block.type === 'heading') {
      const heading = block as DocHeading;
      const run = heading.runs[0] || { id: 'r-1', text: '' };

      const headingStyle: React.CSSProperties = {
        textAlign: heading.align || 'left',
        fontWeight: run.bold ? 'bold' : 'normal',
        fontStyle: run.italic ? 'italic' : 'normal',
        textDecoration: [
          run.underline ? 'underline' : '',
          run.strikethrough ? 'line-through' : '',
        ]
          .filter(Boolean)
          .join(' '),
      };

      const content = (
        <input
          type="text"
          className="doc-block-input"
          value={run.text}
          onChange={(e) => updateTextRun(block.id, run.id, e.target.value)}
        />
      );

      return (
        <div
          key={block.id}
          className={`doc-block-wrap ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            selectBlock(block.id, run.id);
          }}
        >
          {heading.level === 1 && <h1 className="doc-heading" style={headingStyle}>{content}</h1>}
          {heading.level === 2 && <h2 className="doc-heading" style={headingStyle}>{content}</h2>}
          {heading.level >= 3 && <h3 className="doc-heading" style={headingStyle}>{content}</h3>}
          {isSelected && (
            <button className="doc-block-del-btn" title="Delete Block" onClick={() => deleteBlock(block.id)}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      );
    }

    if (block.type === 'paragraph') {
      const paragraph = block as DocParagraph;
      const run = paragraph.runs[0] || { id: 'r-1', text: '' };

      return (
        <div
          key={block.id}
          className={`doc-block-wrap ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            selectBlock(block.id, run.id);
          }}
        >
          <p
            className="doc-paragraph"
            style={{
              textAlign: paragraph.align || 'left',
              fontWeight: run.bold ? 'bold' : 'normal',
              fontStyle: run.italic ? 'italic' : 'normal',
              textDecoration: [
                run.underline ? 'underline' : '',
                run.strikethrough ? 'line-through' : '',
              ]
                .filter(Boolean)
                .join(' '),
            }}
          >
            <input
              type="text"
              className="doc-block-input"
              value={run.text}
              onChange={(e) => updateTextRun(block.id, run.id, e.target.value)}
            />
          </p>
          {isSelected && (
            <button className="doc-block-del-btn" title="Delete Block" onClick={() => deleteBlock(block.id)}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      );
    }

    if (block.type === 'list') {
      const list = block as DocList;

      return (
        <div
          key={block.id}
          className={`doc-block-wrap ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            selectBlock(block.id);
          }}
        >
          {list.ordered ? (
            <ol className="doc-list">
              {list.items.map((item) => (
                <li key={item.id} className="doc-list-item">
                  <input
                    type="text"
                    className="doc-block-input"
                    value={item.runs[0]?.text || ''}
                    onChange={(e) => {
                      const updatedItems = list.items.map((i) =>
                        i.id === item.id ? { ...i, runs: [{ id: i.runs[0]?.id || 'r-1', text: e.target.value }] } : i
                      );
                      useDocumentEditorStore.setState((state) => {
                        const blocks = state.document.sections[0]!.blocks.map((b) =>
                          b.id === block.id ? ({ ...b, items: updatedItems } as DocList) : b
                        );
                        return { document: { ...state.document, sections: [{ ...state.document.sections[0]!, blocks }] } };
                      });
                    }}
                  />
                </li>
              ))}
            </ol>
          ) : (
            <ul className="doc-list">
              {list.items.map((item) => (
                <li key={item.id} className="doc-list-item">
                  <input
                    type="text"
                    className="doc-block-input"
                    value={item.runs[0]?.text || ''}
                    onChange={(e) => {
                      const updatedItems = list.items.map((i) =>
                        i.id === item.id ? { ...i, runs: [{ id: i.runs[0]?.id || 'r-1', text: e.target.value }] } : i
                      );
                      useDocumentEditorStore.setState((state) => {
                        const blocks = state.document.sections[0]!.blocks.map((b) =>
                          b.id === block.id ? ({ ...b, items: updatedItems } as DocList) : b
                        );
                        return { document: { ...state.document, sections: [{ ...state.document.sections[0]!, blocks }] } };
                      });
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          {isSelected && (
            <button className="doc-block-del-btn" title="Delete Block" onClick={() => deleteBlock(block.id)}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      );
    }

    if (block.type === 'table') {
      return <DocumentTableEditor key={block.id} table={block} />;
    }

    return null;
  };

  return (
    <div className="doc-page-viewport">
      <div
        className="doc-page"
        style={{
          width: `${document.pageSize.width}px`,
          minHeight: `${document.pageSize.height}px`,
          padding: `${document.margins.top}px ${document.margins.right}px ${document.margins.bottom}px ${document.margins.left}px`,
        }}
      >
        {/* Render Structured Document Blocks */}
        {section.blocks.map(renderBlock)}

        {/* Page Footer */}
        <div className="doc-page-footer">
          <span>{document.title}</span>
          <span>Page 1</span>
        </div>
      </div>
    </div>
  );
};
