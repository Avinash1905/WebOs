/**
 * @file TextEditorFindReplace.tsx
 * @description Find & Replace panel with case matching, whole word matching, and replace all.
 */

import React, { useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Replace, ReplaceAll } from 'lucide-react';
import { useTextEditorStore } from '../store/textEditorStore.js';

export const TextEditorFindReplace: React.FC = () => {
  const {
    tabs,
    activeTabId,
    findReplace,
    setFindReplaceState,
    toggleFindReplace,
    updateContent,
  } = useTextEditorStore();

  const currentTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    if (!currentTab || !findReplace.findQuery) {
      setFindReplaceState({ matchesCount: 0, currentMatchIndex: 0 });
      return;
    }

    const content = currentTab.content;
    const query = findReplace.findQuery;
    let regexFlags = 'g';
    if (!findReplace.matchCase) regexFlags += 'i';

    try {
      let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (findReplace.wholeWord) pattern = `\\b${pattern}\\b`;

      const regex = new RegExp(pattern, regexFlags);
      const matches = content.match(regex);
      const count = matches ? matches.length : 0;
      setFindReplaceState({ matchesCount: count });
    } catch {
      setFindReplaceState({ matchesCount: 0 });
    }
  }, [currentTab?.content, findReplace.findQuery, findReplace.matchCase, findReplace.wholeWord]);

  if (!findReplace.isOpen) return null;

  const handleReplaceNext = () => {
    if (!currentTab || !findReplace.findQuery) return;
    const content = currentTab.content;
    const query = findReplace.findQuery;
    const replace = findReplace.replaceQuery;

    let regexFlags = '';
    if (!findReplace.matchCase) regexFlags += 'i';
    let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (findReplace.wholeWord) pattern = `\\b${pattern}\\b`;

    const regex = new RegExp(pattern, regexFlags);
    const newContent = content.replace(regex, replace);
    updateContent(newContent);
  };

  const handleReplaceAll = () => {
    if (!currentTab || !findReplace.findQuery) return;
    const content = currentTab.content;
    const query = findReplace.findQuery;
    const replace = findReplace.replaceQuery;

    let regexFlags = 'g';
    if (!findReplace.matchCase) regexFlags += 'i';
    let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (findReplace.wholeWord) pattern = `\\b${pattern}\\b`;

    const regex = new RegExp(pattern, regexFlags);
    const newContent = content.replace(regex, replace);
    updateContent(newContent);
  };

  return (
    <div className="te-find-replace-panel">
      <div className="te-fr-row">
        <div className="te-fr-field">
          <input
            type="text"
            className="te-fr-input"
            placeholder="Find text..."
            value={findReplace.findQuery}
            onChange={(e) => setFindReplaceState({ findQuery: e.target.value })}
            autoFocus
          />
          <span className="te-fr-count">
            {findReplace.findQuery ? `${findReplace.matchesCount} match(es)` : ''}
          </span>
        </div>

        <div className="te-fr-options">
          <label className="te-fr-checkbox">
            <input
              type="checkbox"
              checked={findReplace.matchCase}
              onChange={(e) => setFindReplaceState({ matchCase: e.target.checked })}
            />
            Match Case
          </label>
          <label className="te-fr-checkbox">
            <input
              type="checkbox"
              checked={findReplace.wholeWord}
              onChange={(e) => setFindReplaceState({ wholeWord: e.target.checked })}
            />
            Whole Word
          </label>
        </div>

        <button className="te-btn-icon te-fr-close" onClick={toggleFindReplace}>
          <X size={14} />
        </button>
      </div>

      <div className="te-fr-row">
        <div className="te-fr-field">
          <input
            type="text"
            className="te-fr-input"
            placeholder="Replace with..."
            value={findReplace.replaceQuery}
            onChange={(e) => setFindReplaceState({ replaceQuery: e.target.value })}
          />
        </div>

        <div className="te-fr-actions">
          <button className="te-btn" onClick={handleReplaceNext} disabled={findReplace.matchesCount === 0}>
            <Replace size={14} />
            <span>Replace</span>
          </button>
          <button className="te-btn" onClick={handleReplaceAll} disabled={findReplace.matchesCount === 0}>
            <ReplaceAll size={14} />
            <span>Replace All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
