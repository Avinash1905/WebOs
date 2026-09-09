/**
 * WebOS Backend - Module 2: Prisma Client Abstractions and Delegate Types
 */

export interface PrismaDelegate<TModel, TCreateInput, TUpdateInput, TWhereInput, TOrderByInput> {
  findUnique(args: { where: Record<string, unknown>; include?: Record<string, unknown> }): Promise<TModel | null>;
  findFirst(args?: {
    where?: TWhereInput;
    orderBy?: TOrderByInput;
    include?: Record<string, unknown>;
  }): Promise<TModel | null>;
  findMany(args?: {
    where?: TWhereInput;
    skip?: number;
    take?: number;
    orderBy?: TOrderByInput;
    include?: Record<string, unknown>;
  }): Promise<TModel[]>;
  create(args: { data: TCreateInput; include?: Record<string, unknown> }): Promise<TModel>;
  update(args: { where: Record<string, unknown>; data: TUpdateInput }): Promise<TModel>;
  updateMany(args?: { where?: TWhereInput; data: Record<string, unknown> }): Promise<{ count: number }>;
  delete(args: { where: Record<string, unknown> }): Promise<TModel>;
  deleteMany(args?: { where?: TWhereInput }): Promise<{ count: number }>;
  count(args?: { where?: TWhereInput }): Promise<number>;
  upsert(args: {
    where: Record<string, unknown>;
    create: TCreateInput;
    update: TUpdateInput;
  }): Promise<TModel>;
}

export type PrismaAnyModel = Record<string, unknown>;

export interface IPrismaClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $transaction<T>(fn: (tx: IPrismaClient) => Promise<T>): Promise<T>;

  user: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  userProfile: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  role: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  permission: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  userRole: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  rolePermission: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  session: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  sessionDevice: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  authenticationAttempt: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  passwordResetToken: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  emailVerificationToken: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  securityEvent: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
  loginHistory: PrismaDelegate<PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel, PrismaAnyModel>;
}
