import React, { useState } from 'react';
import './MarkdownStudioApp.css';

export const MarkdownStudioApp: React.FC = () => {
  const [doc, setDoc] = useState(
    '# WebOS Markdown Studio\n\n' +
    'Welcome to **WebOS Studio**, a full-featured live markdown authoring workspace.\n\n' +
    '## Highlights\n' +
    '- Real-time side-by-side rendering\n' +
    '- Math formulas & syntax formatting\n' +
    '- Native desktop export\n\n' +
    '### Code Sample\n' +
    '```typescript\n' +
    'const kernel = WebOS.getKernel();\n' +
    'kernel.spawnProcess("terminal");\n' +
    '```\n\n' +
    '> WebOS 6.0 Enterprise delivers high-performance multi-tasking on the web.'
  );

  const renderSimpleMarkdown = (md: string) => {
    return md
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br/>');
  };

  return (
    <div className="markdown-studio-app">
      <div className="md-toolbar">
        <span className="md-title">Document: Untitled.md</span>
        <div className="md-actions">
          <button className="md-btn" onClick={() => alert('Exporting HTML...')}>Export HTML</button>
        </div>
      </div>
      <div className="md-panes">
        <div className="md-editor-pane">
          <textarea
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            className="md-textarea"
          />
        </div>
        <div
          className="md-preview-pane"
          dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(doc) }}
        />
      </div>
    </div>
  );
};
