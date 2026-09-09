/**
 * WebOS Backend - Authentication HTTP Controller
 * Validates request payloads and maps domain results to HTTP responses.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthService } from './auth.service.js';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  ChangePasswordRequestSchema,
  VerifyEmailRequestSchema
} from './auth.schemas.js';
import { HttpStatus } from '../../common/types/http.types.js';
import { ValidationError, UnauthorizedError } from '../../common/errors/specific-errors.js';
import type { AuthSecurityContext } from './auth.types.js';

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const parseResult = RegisterRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Registration validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const context = this.extractSecurityContext(request);
    const result = await this.authService.register(parseResult.data, context);

    return reply.sendSuccess(result, HttpStatus.CREATED);
  };

  public login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const parseResult = LoginRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Login validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const context = this.extractSecurityContext(request);
    const result = await this.authService.login(parseResult.data, context);

    return reply.sendSuccess(result, HttpStatus.OK);
  };

  public logout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const sessionToken = this.extractSessionToken(request);
    const userId = request.requestContext?.userId;

    if (!sessionToken) {
      throw new UnauthorizedError('No active session found');
    }

    const context = this.extractSecurityContext(request);
    await this.authService.logout(sessionToken, userId, context);

    return reply.sendSuccess({ message: 'Successfully logged out' }, HttpStatus.OK);
  };

  public forgotPassword = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const parseResult = ForgotPasswordRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Forgot password validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const context = this.extractSecurityContext(request);
    const result = await this.authService.requestPasswordReset(parseResult.data, context);

    return reply.sendSuccess(result, HttpStatus.OK);
  };

  public resetPassword = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const parseResult = ResetPasswordRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Reset password validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const context = this.extractSecurityContext(request);
    await this.authService.resetPassword(parseResult.data, context);

    return reply.sendSuccess(
      { message: 'Password has been successfully updated. Please log in with your new password.' },
      HttpStatus.OK
    );
  };

  public changePassword = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const userId = request.requestContext?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const parseResult = ChangePasswordRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Change password validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const context = this.extractSecurityContext(request);
    await this.authService.changePassword(
      {
        userId,
        currentPassword: parseResult.data.currentPassword,
        newPassword: parseResult.data.newPassword
      },
      context
    );

    return reply.sendSuccess(
      { message: 'Password changed successfully' },
      HttpStatus.OK
    );
  };

  public verifyEmail = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const parseResult = VerifyEmailRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(
        'Email verification validation failed',
        parseResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }

    const context = this.extractSecurityContext(request);
    await this.authService.verifyEmail(parseResult.data, context);

    return reply.sendSuccess(
      { message: 'Email verified successfully. Your account is fully active.' },
      HttpStatus.OK
    );
  };

  private extractSecurityContext(request: FastifyRequest): AuthSecurityContext {
    return {
      ipAddress: request.requestContext?.client?.ip || request.ip || '127.0.0.1',
      userAgent:
        request.requestContext?.client?.userAgent ||
        (request.headers['user-agent'] as string) ||
        'unknown'
    };
  }

  private extractSessionToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return null;
  }
}
