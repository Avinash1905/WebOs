/**
 * @file applications/database-viewer/types.ts
 * @description Type definitions for the WebOS Database Viewer application.
 */

export type DataType = 'INTEGER' | 'TEXT' | 'REAL' | 'BOOLEAN' | 'DATETIME' | 'BLOB';

export interface ColumnMetadata {
  name: string;
  type: DataType;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  foreignKeyTarget?: string;
  defaultValue?: any;
}

export interface TableConstraint {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  definition: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  isUnique: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnMetadata[];
  constraints: TableConstraint[];
  indexes: TableIndex[];
  rowCount: number;
}

export interface SchemaMetadata {
  name: string;
  tables: TableSchema[];
  views: Array<{ name: string; sql: string }>;
}

export interface DatabaseMetadata {
  id: string;
  name: string;
  sizeBytes: number;
  schemas: SchemaMetadata[];
  createdAt: number;
  updatedAt: number;
}

export type QueryStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface SavedQuery {
  id: string;
  title: string;
  sql: string;
  createdAt: number;
}

export interface DatabaseState {
  databases: DatabaseMetadata[];
  activeDatabaseId: string | null;
  activeSchemaName: string;
  activeTableName: string | null;
  
  tableRows: Record<string, any>[];
  totalRows: number;
  currentPage: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filterQuery: string;

  activeQuerySql: string;
  queryStatus: QueryStatus;
  queryResult: QueryResult | null;
  queryHistory: string[];
  savedQueries: SavedQuery[];

  selectedRecord: Record<string, any> | null;
  isRecordModalOpen: boolean;
  isFilterModalOpen: boolean;
  isEditingNewRecord: boolean;
}

export interface DatabaseActions {
  setActiveDatabase: (id: string) => void;
  setActiveSchema: (name: string) => void;
  setActiveTable: (name: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (column: string) => void;
  setFilterQuery: (query: string) => void;

  executeSqlQuery: (sql: string) => Promise<void>;
  saveQuery: (title: string, sql: string) => void;
  deleteSavedQuery: (id: string) => void;

  openNewRecordModal: () => void;
  openEditRecordModal: (record: Record<string, any>) => void;
  closeRecordModal: () => void;
  saveRecord: (record: Record<string, any>) => Promise<void>;
  deleteRecord: (primaryKeyVal: any) => Promise<void>;
  
  refreshDatabase: () => Promise<void>;
}
