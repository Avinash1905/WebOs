import React, { useState } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Download,
  Bookmark,
  Printer,
} from 'lucide-react';
import './pdfViewer.css';

interface DocPage {
  pageNumber: number;
  title: string;
  paragraphs: string[];
}

const SAMPLE_DOCUMENT: DocPage[] = [
  {
    pageNumber: 1,
    title: 'WebOS Operating System Specification & Architecture Whitepaper',
    paragraphs: [
      'WebOS is a next-generation browser-native operating system kernel and desktop environment designed for high-concurrency desktop multitasking, POSIX filesystem operations, and distributed cloud synchronization.',
      'The architecture is partitioned into four major layers: (1) Core Virtual Kernel with POSIX Inode table and Preemptive Process Scheduler, (2) UI Shell and Compositor with multi-window snapping and theme token systems, (3) Application catalog with dynamic sandbox runtime, and (4) Backend persistence and WebSocket delta synchronizer.',
      'Key architectural objectives include zero-latency window management, resilient offline-first storage through IndexedDB VFS adapters, and strict memory compartmentalization using virtual paging simulations.',
    ],
  },
  {
    pageNumber: 2,
    title: 'Section 2: Virtual Memory & Process Management Subsystem',
    paragraphs: [
      'The WebOS kernel implements demand paging using 4KB virtual pages mapped onto a 64MB simulated physical RAM matrix. Each process control block (PCB) maintains its own private page directory.',
      'Process execution follows a preemptive round-robin scheduling algorithm with configurable quantum timeslices (20ms default) and dynamic priority boosting for interactive UI tasks.',
      'Inter-process communication (IPC) is facilitated through POSIX-compliant message queues, FIFO named pipes, and shared memory segments backed by ArrayBuffers.',
    ],
  },
  {
    pageNumber: 3,
    title: 'Section 3: POSIX Virtual File System (VFS) and Cloud Delta Sync',
    paragraphs: [
      'The VFS exposes a POSIX file descriptor table, inode indexing, and pseudo-filesystems such as /proc for telemetry and /dev for virtual hardware devices.',
      'All filesystem mutations emit deterministic inotify events that are buffered into a Write-Ahead Log (WAL) and synchronized to the PostgreSQL cloud backend using WebSocket delta streams with vector clock conflict resolution.',
    ],
  },
];

export const PdfViewerApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(true);

  const totalPages = SAMPLE_DOCUMENT.length;
  const activePage = SAMPLE_DOCUMENT[currentPage - 1] || SAMPLE_DOCUMENT[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pdf-viewer-container">
      {/* Top Controls Toolbar */}
      <div className="pdf-toolbar">
        <div className="pdf-page-nav">
          <button
            className="pdf-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="page-counter">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pdf-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="pdf-zoom-group">
          <button className="pdf-btn" onClick={() => setZoom((z) => Math.max(60, z - 20))} title="Zoom Out">
            <ZoomOut size={15} />
          </button>
          <span className="zoom-text">{zoom}%</span>
          <button className="pdf-btn" onClick={() => setZoom((z) => Math.min(250, z + 20))} title="Zoom In">
            <ZoomIn size={15} />
          </button>
          <button className="pdf-btn" onClick={() => setRotation((r) => (r + 90) % 360)} title="Rotate">
            <RotateCw size={15} />
          </button>
        </div>

        <div className="pdf-search-box">
          <Search size={13} />
          <input
            type="text"
            placeholder="Search document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pdf-actions-right">
          <button
            className={`pdf-btn ${showBookmarks ? 'active' : ''}`}
            onClick={() => setShowBookmarks(!showBookmarks)}
            title="Toggle Outline"
          >
            <Bookmark size={15} />
          </button>
          <button className="pdf-btn" onClick={handlePrint} title="Print Document">
            <Printer size={15} />
          </button>
          <button className="pdf-btn highlight" onClick={() => alert('Document exported.')} title="Download PDF">
            <Download size={15} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="pdf-main-body">
        {/* Outline / Bookmarks Sidebar */}
        {showBookmarks && (
          <div className="pdf-outline-sidebar">
            <div className="outline-header">Table of Contents</div>
            <div className="outline-list">
              {SAMPLE_DOCUMENT.map((p) => (
                <div
                  key={p.pageNumber}
                  className={`outline-item ${currentPage === p.pageNumber ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p.pageNumber)}
                >
                  <FileText size={13} />
                  <span>{p.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Page Canvas */}
        <div className="pdf-canvas-scroller">
          <div
            className="pdf-page-sheet"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
            }}
          >
            <div className="page-header-row">
              <span className="doc-watermark">WebOS Specification v2.1</span>
              <span className="doc-page-badge">Page {activePage.pageNumber}</span>
            </div>

            <h1 className="doc-title">{activePage.title}</h1>
            <hr className="doc-divider" />

            <div className="doc-paragraphs">
              {activePage.paragraphs.map((para, idx) => {
                if (searchQuery.trim()) {
                  const parts = para.split(new RegExp(`(${searchQuery})`, 'gi'));
                  return (
                    <p key={idx} className="doc-p">
                      {parts.map((part, i) =>
                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                          <mark key={i} className="pdf-search-highlight">{part}</mark>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                }
                return <p key={idx} className="doc-p">{para}</p>;
              })}
            </div>

            <div className="page-footer-row">
              <span>Confidential & Proprietary - WebOS Kernel Research</span>
              <span>Doc ID: #WOS-SPEC-2026-A</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
