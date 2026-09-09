/**
 * @file applications/database-viewer/store/databaseViewerStore.ts
 * @description Isolated Zustand store for WebOS Database Viewer application.
 */

import { create } from 'zustand';
import { DatabaseService } from '../engine/DatabaseService.js';
import { SqlQueryEngine } from '../engine/SqlQueryEngine.js';
import type {
  DatabaseState,
  DatabaseActions,
  SavedQuery,
} from '../types.js';

export const useDatabaseViewerStore = create<DatabaseState & DatabaseActions>((set, get) => ({
  databases: [],
  activeDatabaseId: null,
  activeSchemaName: 'main',
  activeTableName: null,

  tableRows: [],
  totalRows: 0,
  currentPage: 1,
  pageSize: 10,
  sortColumn: null,
  sortDirection: 'asc',
  filterQuery: '',

  activeQuerySql: 'SELECT * FROM users;',
  queryStatus: 'idle',
  queryResult: null,
  queryHistory: [
    'SELECT * FROM users;',
    "SELECT pid, app_id, memory_mb FROM processes_log WHERE status = 'running';",
  ],
  savedQueries: [
    {
      id: 'sq-1',
      title: 'All Active Processes',
      sql: 'SELECT * FROM processes_log;',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'sq-2',
      title: 'Admin Users',
      sql: "SELECT * FROM users WHERE role = 'admin';",
      createdAt: Date.now() - 43200000,
    },
  ],

  selectedRecord: null,
  isRecordModalOpen: false,
  isFilterModalOpen: false,
  isEditingNewRecord: false,

  setActiveDatabase: (id: string) => {
    set({ activeDatabaseId: id, currentPage: 1 });
    get().refreshDatabase();
  },

  setActiveSchema: (name: string) => {
    set({ activeSchemaName: name, currentPage: 1 });
  },

  setActiveTable: async (name: string) => {
    set({ activeTableName: name, currentPage: 1, sortColumn: null, filterQuery: '' });
    const { currentPage, pageSize, sortColumn, sortDirection, filterQuery } = get();
    const { rows, total } = await DatabaseService.getTableRows(
      name,
      currentPage,
      pageSize,
      sortColumn,
      sortDirection,
      filterQuery
    );
    set({ tableRows: rows, totalRows: total, activeQuerySql: `SELECT * FROM ${name};` });
  },

  setPage: async (page: number) => {
    set({ currentPage: page });
    const { activeTableName, pageSize, sortColumn, sortDirection, filterQuery } = get();
    if (!activeTableName) return;
    const { rows, total } = await DatabaseService.getTableRows(
      activeTableName,
      page,
      pageSize,
      sortColumn,
      sortDirection,
      filterQuery
    );
    set({ tableRows: rows, totalRows: total });
  },

  setPageSize: async (size: number) => {
    set({ pageSize: size, currentPage: 1 });
    const { activeTableName, sortColumn, sortDirection, filterQuery } = get();
    if (!activeTableName) return;
    const { rows, total } = await DatabaseService.getTableRows(
      activeTableName,
      1,
      size,
      sortColumn,
      sortDirection,
      filterQuery
    );
    set({ tableRows: rows, totalRows: total });
  },

  setSort: async (column: string) => {
    const { sortColumn, sortDirection, activeTableName, currentPage, pageSize, filterQuery } = get();
    const newDir = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    set({ sortColumn: column, sortDirection: newDir });

    if (activeTableName) {
      const { rows, total } = await DatabaseService.getTableRows(
        activeTableName,
        currentPage,
        pageSize,
        column,
        newDir,
        filterQuery
      );
      set({ tableRows: rows, totalRows: total });
    }
  },

  setFilterQuery: async (filterVal: string) => {
    set({ filterQuery: filterVal, currentPage: 1 });
    const { activeTableName, pageSize, sortColumn, sortDirection } = get();
    if (!activeTableName) return;
    const { rows, total } = await DatabaseService.getTableRows(
      activeTableName,
      1,
      pageSize,
      sortColumn,
      sortDirection,
      filterVal
    );
    set({ tableRows: rows, totalRows: total });
  },

  executeSqlQuery: async (sql: string) => {
    set({ queryStatus: 'running', activeQuerySql: sql });
    const res = await SqlQueryEngine.executeQuery(sql);
    const { queryHistory } = get();

    const updatedHistory = [sql, ...queryHistory.filter((q) => q !== sql)].slice(0, 20);

    if (res.error) {
      set({ queryStatus: 'failed', queryResult: res, queryHistory: updatedHistory });
    } else {
      set({ queryStatus: 'completed', queryResult: res, queryHistory: updatedHistory });
    }
  },

  saveQuery: (title: string, sql: string) => {
    const newQuery: SavedQuery = {
      id: `sq-${Date.now()}`,
      title,
      sql,
      createdAt: Date.now(),
    };
    set({ savedQueries: [...get().savedQueries, newQuery] });
  },

  deleteSavedQuery: (id: string) => {
    set({ savedQueries: get().savedQueries.filter((q) => q.id !== id) });
  },

  openNewRecordModal: () => {
    set({ selectedRecord: {}, isRecordModalOpen: true, isEditingNewRecord: true });
  },

  openEditRecordModal: (record: Record<string, any>) => {
    set({ selectedRecord: record, isRecordModalOpen: true, isEditingNewRecord: false });
  },

  closeRecordModal: () => {
    set({ isRecordModalOpen: false, selectedRecord: null });
  },

  saveRecord: async (recordData: Record<string, any>) => {
    const { activeTableName, isEditingNewRecord, selectedRecord } = get();
    if (!activeTableName) return;

    if (isEditingNewRecord) {
      await DatabaseService.insertRecord(activeTableName, recordData);
    } else if (selectedRecord) {
      const primaryKeyCol = Object.keys(recordData)[0] || 'id';
      await DatabaseService.updateRecord(
        activeTableName,
        primaryKeyCol,
        selectedRecord[primaryKeyCol],
        recordData
      );
    }

    set({ isRecordModalOpen: false });
    get().setActiveTable(activeTableName);
  },

  deleteRecord: async (primaryKeyVal: any) => {
    const { activeTableName, tableRows } = get();
    if (!activeTableName || tableRows.length === 0) return;
    const primaryKeyCol = Object.keys(tableRows[0])[0] || 'id';
    await DatabaseService.deleteRecord(activeTableName, primaryKeyCol, primaryKeyVal);
    get().setActiveTable(activeTableName);
  },

  refreshDatabase: async () => {
    const dbs = await DatabaseService.fetchDatabases();
    const activeDb = dbs.find((d) => d.id === get().activeDatabaseId) || dbs[0];
    const defaultTable = activeDb?.schemas[0]?.tables[0]?.name || null;

    set({
      databases: dbs,
      activeDatabaseId: activeDb?.id || null,
      activeTableName: defaultTable,
    });

    if (defaultTable) {
      get().setActiveTable(defaultTable);
    }
  },
}));
