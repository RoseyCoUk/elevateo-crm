import { randomUUID } from 'node:crypto';
import { getStore, saveStore, type Store } from './store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
type OrderSpec = { column: string; ascending: boolean };

interface FilterSpec {
  type: 'eq' | 'in' | 'is';
  column: string;
  value: unknown;
}

export interface QueryResult<T> {
  data: T;
  error: { message: string } | null;
  count: number | null;
}

function matches(row: Row, filters: FilterSpec[]): boolean {
  for (const f of filters) {
    const val = row[f.column];
    if (f.type === 'eq') {
      if (val !== f.value) return false;
    } else if (f.type === 'in') {
      const arr = f.value as unknown[];
      if (!arr.includes(val)) return false;
    } else if (f.type === 'is') {
      if (f.value === null) {
        if (val !== null && val !== undefined) return false;
      } else {
        if (val !== f.value) return false;
      }
    }
  }
  return true;
}

function applyOrder(rows: Row[], order: OrderSpec[]): Row[] {
  if (!order.length) return rows;
  return [...rows].sort((a: Row, b: Row) => {
    for (const o of order) {
      const av = a[o.column];
      const bv = b[o.column];
      if (av === bv) continue;
      if (av == null) return o.ascending ? -1 : 1;
      if (bv == null) return o.ascending ? 1 : -1;
      if (av < bv) return o.ascending ? -1 : 1;
      if (av > bv) return o.ascending ? 1 : -1;
    }
    return 0;
  });
}

function nowIso() {
  return new Date().toISOString();
}

type Table = keyof Omit<Store, 'sessions'> | 'sessions';

const TABLE_KEYS = new Set<string>([
  'divisions',
  'users',
  'clients',
  'projects',
  'client_members',
  'project_members',
  'tasks',
  'task_comments',
  'approvals',
  'notifications',
  'activity_log',
  'files',
  'sessions',
]);

class FilterBuilder {
  protected _filters: FilterSpec[] = [];
  protected _order: OrderSpec[] = [];
  protected _limit: number | null = null;
  protected _countMode: 'exact' | null = null;
  protected _headOnly = false;

  constructor(
    protected table: Table,
    protected mode: 'select' | 'update' | 'delete',
    protected payload?: Row
  ) {}

  eq(column: string, value: unknown): this {
    this._filters.push({ type: 'eq', column, value });
    return this;
  }
  in(column: string, value: unknown[]): this {
    this._filters.push({ type: 'in', column, value });
    return this;
  }
  is(column: string, value: unknown): this {
    this._filters.push({ type: 'is', column, value });
    return this;
  }
  order(column: string, opts?: { ascending?: boolean }): this {
    this._order.push({ column, ascending: opts?.ascending !== false });
    return this;
  }
  limit(n: number): this {
    this._limit = n;
    return this;
  }

  protected runSelect(): QueryResult<Row[]> {
    const store = getStore();
    const rows = (store[this.table] as unknown as Row[]) ?? [];
    let result = rows.filter((r) => matches(r, this._filters));
    result = applyOrder(result, this._order);
    const count = result.length;
    if (this._limit != null) result = result.slice(0, this._limit);
    return {
      data: this._headOnly ? [] : result.map((r) => ({ ...r })),
      error: null,
      count: this._countMode ? count : null,
    };
  }

  protected runUpdate(): QueryResult<Row[]> {
    const store = getStore();
    const rows = (store[this.table] as unknown as Row[]) ?? [];
    const patch = (this.payload ?? {}) as Row;
    const touched: Row[] = [];
    for (const r of rows) {
      if (!matches(r, this._filters)) continue;
      for (const k of Object.keys(patch)) {
        if (patch[k] !== undefined) r[k] = patch[k];
      }
      if (['users', 'clients', 'projects', 'tasks'].includes(this.table)) {
        r.updated_at = nowIso();
      }
      touched.push({ ...r });
    }
    saveStore();
    return { data: touched, error: null, count: touched.length };
  }

  protected runDelete(): QueryResult<Row[]> {
    const store = getStore();
    const rows = (store[this.table] as unknown as Row[]) ?? [];
    const keep: Row[] = [];
    const removed: Row[] = [];
    for (const r of rows) {
      if (matches(r, this._filters)) removed.push({ ...r });
      else keep.push(r);
    }
    (store as unknown as Record<string, Row[]>)[this.table] = keep;
    saveStore();
    return { data: removed, error: null, count: removed.length };
  }

  protected exec(): QueryResult<Row[]> {
    try {
      if (this.mode === 'select') return this.runSelect();
      if (this.mode === 'update') return this.runUpdate();
      return this.runDelete();
    } catch (e) {
      return { data: [], error: { message: (e as Error).message }, count: null };
    }
  }

  maybeSingle(): Promise<QueryResult<Row | null>> {
    const r = this.exec();
    return Promise.resolve({ data: r.data[0] ?? null, error: r.error, count: r.count });
  }

  single(): Promise<QueryResult<Row | null>> {
    const r = this.exec();
    if (r.data.length === 0)
      return Promise.resolve({ data: null, error: { message: 'No rows' }, count: 0 });
    return Promise.resolve({ data: r.data[0], error: r.error, count: r.count });
  }

  then<TResult1 = QueryResult<Row[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<Row[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.exec()).then(onfulfilled, onrejected);
  }
}

class SelectBuilder extends FilterBuilder {
  constructor(table: Table, opts?: { count?: 'exact'; head?: boolean }) {
    super(table, 'select');
    if (opts?.count) this._countMode = opts.count;
    if (opts?.head) this._headOnly = true;
  }
}

class InsertChain {
  constructor(private table: Table, private payload: Row | Row[]) {}

  private exec(): QueryResult<Row[]> {
    try {
      const store = getStore();
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: Row[] = [];
      const now = nowIso();
      const target = store[this.table] as unknown as Row[];
      for (const r of rows) {
        const withDefaults: Row = { ...r };
        if (!('id' in withDefaults) || !withDefaults.id) withDefaults.id = randomUUID();
        if (!('created_at' in withDefaults)) withDefaults.created_at = now;
        if (
          ['users', 'clients', 'projects', 'tasks'].includes(this.table) &&
          !('updated_at' in withDefaults)
        ) {
          withDefaults.updated_at = now;
        }
        target.push(withDefaults);
        inserted.push({ ...withDefaults });
      }
      saveStore();
      return { data: inserted, error: null, count: inserted.length };
    } catch (e) {
      return { data: [], error: { message: (e as Error).message }, count: null };
    }
  }

  select(_cols?: string) {
    const exec = () => this.exec();
    return {
      single(): Promise<QueryResult<Row | null>> {
        const r = exec();
        return Promise.resolve({ data: r.data[0] ?? null, error: r.error, count: r.count });
      },
      maybeSingle(): Promise<QueryResult<Row | null>> {
        const r = exec();
        return Promise.resolve({ data: r.data[0] ?? null, error: r.error, count: r.count });
      },
      then<T1 = QueryResult<Row[]>, T2 = never>(
        ok?: ((v: QueryResult<Row[]>) => T1 | PromiseLike<T1>) | null,
        err?: ((r: unknown) => T2 | PromiseLike<T2>) | null
      ): PromiseLike<T1 | T2> {
        return Promise.resolve(exec()).then(ok, err);
      },
    };
  }

  then<T1 = QueryResult<Row[]>, T2 = never>(
    ok?: ((v: QueryResult<Row[]>) => T1 | PromiseLike<T1>) | null,
    err?: ((r: unknown) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    return Promise.resolve(this.exec()).then(ok, err);
  }
}

export class TableQuery {
  constructor(private table: Table) {
    if (!TABLE_KEYS.has(this.table as string)) {
      throw new Error(`Unknown table: ${this.table}`);
    }
  }

  select(_cols?: string, opts?: { count?: 'exact'; head?: boolean }) {
    return new SelectBuilder(this.table, opts);
  }

  insert(payload: Row | Row[]) {
    return new InsertChain(this.table, payload);
  }

  update(patch: Row) {
    return new FilterBuilder(this.table, 'update', patch);
  }

  delete() {
    return new FilterBuilder(this.table, 'delete');
  }
}
