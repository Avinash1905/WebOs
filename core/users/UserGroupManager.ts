/**
 * @file UserGroupManager.ts
 * @description POSIX-style User Groups and Membership Subsystem for WebOS.
 */

export interface UserGroup {
  readonly gid: string;
  readonly name: string;
  readonly description?: string;
  readonly members: readonly string[]; // userIds
  readonly isSystem: boolean;
  readonly createdAt: number;
}

export class UserGroupManager {
  private readonly groups = new Map<string, UserGroup>();

  constructor() {
    this.createSystemGroup('wheel', 'Administrative Superusers');
    this.createSystemGroup('users', 'Standard OS Users');
    this.createSystemGroup('guests', 'Guest Accounts');
  }

  public createGroup(name: string, description?: string): UserGroup {
    if (this.getGroupByName(name)) {
      throw new Error(`Group ${name} already exists`);
    }

    const gid = `grp_${name}_${Date.now()}`;
    const group: UserGroup = {
      gid,
      name,
      description,
      members: [],
      isSystem: false,
      createdAt: Date.now()
    };

    this.groups.set(gid, group);
    return group;
  }

  public addUserToGroup(gidOrName: string, userId: string): UserGroup {
    const group = this.resolveGroup(gidOrName);
    if (!group) throw new Error(`Group ${gidOrName} not found`);

    if (group.members.includes(userId)) return group;

    const updated: UserGroup = {
      ...group,
      members: Object.freeze([...group.members, userId])
    };

    this.groups.set(group.gid, updated);
    return updated;
  }

  public removeUserFromGroup(gidOrName: string, userId: string): UserGroup {
    const group = this.resolveGroup(gidOrName);
    if (!group) throw new Error(`Group ${gidOrName} not found`);

    const updated: UserGroup = {
      ...group,
      members: Object.freeze(group.members.filter(id => id !== userId))
    };

    this.groups.set(group.gid, updated);
    return updated;
  }

  public getUserGroups(userId: string): readonly UserGroup[] {
    return Array.from(this.groups.values()).filter(g => g.members.includes(userId));
  }

  public isUserInGroup(userId: string, gidOrName: string): boolean {
    const group = this.resolveGroup(gidOrName);
    return group ? group.members.includes(userId) : false;
  }

  public listGroups(): readonly UserGroup[] {
    return Array.from(this.groups.values());
  }

  private createSystemGroup(name: string, description: string): void {
    const gid = `sys_${name}`;
    this.groups.set(gid, {
      gid,
      name,
      description,
      members: [],
      isSystem: true,
      createdAt: Date.now()
    });
  }

  private resolveGroup(gidOrName: string): UserGroup | undefined {
    if (this.groups.has(gidOrName)) return this.groups.get(gidOrName);
    return this.getGroupByName(gidOrName);
  }

  private getGroupByName(name: string): UserGroup | undefined {
    for (const g of this.groups.values()) {
      if (g.name === name) return g;
    }
    return undefined;
  }
}
