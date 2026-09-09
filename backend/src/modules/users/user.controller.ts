/**
 * WebOS Backend - User Management HTTP Controller
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserService } from './user.service.js';
import {
  UpdateProfileRequestSchema,
  UpdateDesktopPreferencesRequestSchema,
  ChangeUserStatusRequestSchema,
  UserQueryRequestSchema
} from './user.schemas.js';
import { HttpStatus } from '../../common/types/http.types.js';
import { ValidationError, UnauthorizedError } from '../../common/errors/specific-errors.js';

export class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  public getMe = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await this.userService.getUserById(userId);
    return reply.sendSuccess(user, HttpStatus.OK);
  };

  public updateMe = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const parseResult = UpdateProfileRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Profile update validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const updated = await this.userService.updateProfile(userId, parseResult.data);
    return reply.sendSuccess(updated, HttpStatus.OK);
  };

  public getDesktopPreferences = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const prefs = await this.userService.getDesktopPreferences(userId);
    return reply.sendSuccess(prefs, HttpStatus.OK);
  };

  public updateDesktopPreferences = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const parseResult = UpdateDesktopPreferencesRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Desktop preferences validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const updated = await this.userService.updateDesktopPreferences(userId, parseResult.data);
    return reply.sendSuccess(updated, HttpStatus.OK);
  };

  public listUsers = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const parseResult = UserQueryRequestSchema.safeParse(request.query);
    if (!parseResult.success) {
      throw new ValidationError(
        'User query validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const result = await this.userService.listUsers(parseResult.data);
    return reply.sendSuccess(result, HttpStatus.OK);
  };

  public getUserById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id: string };
    const user = await this.userService.getUserById(params.id);
    return reply.sendSuccess(user, HttpStatus.OK);
  };

  public changeStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id: string };
    const actorId = request.requestContext?.userId || 'system';
    const ip = request.requestContext?.client?.ip || request.ip;

    const parseResult = ChangeUserStatusRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Status update validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const updated = await this.userService.changeUserStatus(params.id, parseResult.data, actorId, ip);
    return reply.sendSuccess(updated, HttpStatus.OK);
  };

  public deleteUser = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id: string };
    const actorId = request.requestContext?.userId || 'system';
    const ip = request.requestContext?.client?.ip || request.ip;

    await this.userService.deleteUser(params.id, actorId, ip);
    return reply.sendSuccess({ message: `User ${params.id} deleted successfully` }, HttpStatus.OK);
  };
}
