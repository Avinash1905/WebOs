# WebOS Module 3.3 — Calculation, Data & Management Applications Architecture

## 1. Overview

Module 3.3 expands WebOS with four enterprise-grade desktop productivity and system management applications built using modern TypeScript, React, and Zustand state management:

1. **Calculator** (`applications/calculator/`)
2. **Spreadsheet** (`applications/spreadsheet/`)
3. **Database Viewer** (`applications/database-viewer/`)
4. **Task Manager** (`applications/task-manager/`)

All applications integrate natively with the WebOS Application SDK, Window Manager, VFS FileSystem, Storage Engine, Event Bus, and Process Manager.

---

## 2. Application Architectures

### 2.1 Calculator Application

- **AST Expression Engine** (`ExpressionParser.ts`): Implements a safe, non-`eval` Tokenizer, Lexer, AST Parser, and Evaluator supporting complex arithmetic, precedence, nested parentheses, negative numbers, and scientific notation.
- **Scientific Functions**: Supports 20+ math functions including `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`, `log`, `log10`, `ln`, `sqrt`, `cbrt`, `abs`, `exp`, `pow`, `factorial`, `floor`, `ceil`, `round`, and constants `PI` and `E`.
- **Unit Converter Engine** (`UnitConverter.ts`): Local offline conversion across 12 categories: Length, Weight, Temperature, Area, Volume, Time, Speed, Data Storage, Pressure, Energy, Power, and Angle.
- **State & Memory**: Managed by Zustand (`calculatorStore.ts`) providing `MS`, `MR`, `M+`, `M-`, `MC`, calculation history persistence, and keyboard input handling.

### 2.2 Spreadsheet Application

- **Grid & Cell Model** (`CellModel.ts`): Maps matrix coordinates (`A1` to `Z100`) and range selections (`A1:C10`).
- **Formula Engine** (`FormulaParser.ts`): Safe formula lexer and AST parser supporting 35+ functions (`SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA`, `COUNTIF`, `SUMIF`, `AVERAGEIF`, `IF`, `AND`, `OR`, `NOT`, `ROUND`, `ABS`, `SQRT`, `PRODUCT`, `CONCAT`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `TODAY`, `NOW`).
- **Dependency Engine** (`DependencyGraph.ts`): Builds direct and inverse cell reference graphs for topological recalculation and automatic cycle detection (`#CIRCULAR!`).
- **Formatting Engine** (`FormattingEngine.ts`): Formats cells with Currency (`$`), Percent (`%`), Dates, Numbers, Bold, Italic, Underline, Text alignment, and Custom colors.
- **Clipboard & Series Fill** (`ClipboardFillEngine.ts`): Adjusts relative and absolute formula references (`$A$1` vs `A1`) during copy/paste and series fills (`Ctrl+D`, `Ctrl+R`).
- **Sort & Filter Engine** (`SortFilterEngine.ts`): Multi-column range sorting and filtering.
- **SVG Chart Engine** (`ChartEngine.ts`): Local vector chart rendering (Bar, Line, Pie, Area) without external APIs.
- **Workbook Architecture**: Multi-sheet tab navigation, sheet rename/add/delete, and undo/redo command history.

### 2.3 Database Viewer Application

- **Database Engine Service** (`DatabaseService.ts`): Inspects local WebOS database metadata, schemas, tables, columns, primary keys, indexes, and views.
- **Table Data Grid**: Supports virtualized table viewing, pagination, search filter, column sorting, and record editing (insert, edit, delete with validation).
- **Safe SQL Query Console** (`SqlQueryEngine.ts`): Tokenizes and executes local SQL queries (`SELECT`, `WHERE`, `ORDER BY`, `LIMIT`, `OFFSET`) with execution status, timing (ms), query history, and saved queries.

### 2.4 Task Manager Application

- **Process Manager Integration** (`TaskManagerService.ts`): Integrates with Member 2's `useWindowStore`, `platform.kernel`, and core process services without duplicating process management.
- **Process Table & Metrics**: Displays live PIDs, process names, state badges (`created`, `ready`, `running`, `suspended`, `waiting`, `terminated`), CPU %, Memory (MB), Start time, Priority, and permissions.
- **Process Controls**: Supports Suspend, Resume, Terminate, and Force Kill operations with safety confirmation dialogs.
- **Real-Time Performance Graphs**: SVG sparklines for CPU utilization % and Memory pool consumption over time.

---

## 3. Platform Integration

All four applications consume WebOS platform services:
- **Window Manager**: Window routing in `WindowContent.tsx`.
- **App Registry**: Manifest definitions in `appRegistry.ts`.
- **Filesystem & Storage**: Workbook file saving/loading, preferences, query history.
- **Event Bus**: Subscribes to system lifecycle events.

---

## 4. Testing & Verification

Comprehensive Vitest test coverage:
- `tests/applications/Calculator.test.ts`
- `tests/applications/Spreadsheet.test.ts`
- `tests/applications/DatabaseViewer.test.ts`
- `tests/applications/TaskManager.test.ts`
- `tests/applications/Module33Integration.test.ts`
