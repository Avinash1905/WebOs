/**
 * WebOS Backend - RBAC HTTP Controller
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RbacService } from './rbac.service.js';
import {
  CreateRoleRequestSchema,
  UpdateRoleRequestSchema,
  AssignRoleRequestSchema
} from './rbac.schemas.js';
import { HttpStatus } from '../../common/types/http.types.js';
import { ValidationError, UnauthorizedError } from '../../common/errors/specific-errors.js';

export class RbacController {
  private readonly rbacService: RbacService;

  constructor(rbacService: RbacService) {
    this.rbacService = rbacService;
  }

  public listRoles = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const roles = await this.rbacService.listRoles();
    return reply.sendSuccess(roles, HttpStatus.OK);
  };

  public getRole = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id: string };
    const role = await this.rbacService.getRoleWithPermissions(params.id);
    return reply.sendSuccess(role, HttpStatus.OK);
  };

  public createRole = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const actorId = request.requestContext?.userId || 'system';
    const ip = request.requestContext?.client?.ip || request.ip;

    const parseResult = CreateRoleRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Role creation validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const created = await this.rbacService.createRole(parseResult.data, actorId, ip);
    return reply.sendSuccess(created, HttpStatus.CREATED);
  };

  public updateRole = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id: string };
    const actorId = request.requestContext?.userId || 'system';
    const ip = request.requestContext?.client?.ip || request.ip;

    const parseResult = UpdateRoleRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Role update validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const updated = await this.rbacService.updateRole(params.id, parseResult.data, actorId, ip);
    return reply.sendSuccess(updated, HttpStatus.OK);
  };

  public deleteRole = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id: string };
    const actorId = request.requestContext?.userId || 'system';
    const ip = request.requestContext?.client?.ip || request.ip;

    await this.rbacService.deleteRole(params.id, actorId, ip);
    return reply.sendSuccess({ message: `Role ${params.id} deleted successfully` }, HttpStatus.OK);
  };

  public listPermissions = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const perms = await this.rbacService.listPermissions();
    return reply.sendSuccess(perms, HttpStatus.OK);
  };

  public assignRole = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const actorId = request.requestContext?.userId || 'system';
    const ip = request.requestContext?.client?.ip || request.ip;

    const parseResult = AssignRoleRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Assign role validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const assignment = await this.rbacService.assignRoleToUser(
      parseResult.data.userId,
      parseResult.data.roleId,
      actorId,
      ip
    );

    return reply.sendSuccess(assignment, HttpStatus.OK);
  };

  public removeRole = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { userId: string; roleId: string };
    const actorId = request.requestContext?.userId || 'system';
    const ip = request.requestContext?.client?.ip || request.ip;

    await this.rbacService.removeRoleFromUser(params.userId, params.roleId, actorId, ip);
    return reply.sendSuccess({ message: 'Role removed from user' }, HttpStatus.OK);
  };

  public getMyPermissions = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const [permissions, roles] = await Promise.all([
      this.rbacService.getUserPermissions(userId),
      this.rbacService.getUserRoles(userId)
    ]);

    return reply.sendSuccess({ roles, permissions }, HttpStatus.OK);
  };
}
