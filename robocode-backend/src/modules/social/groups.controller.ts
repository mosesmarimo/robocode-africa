import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { CurrentUser, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import {
  createGroupSchema,
  type CreateGroupInput,
  updateGroupSchema,
  type UpdateGroupInput,
  memberRoleSchema,
  type MemberRoleInput,
} from "./dto";

@Controller("social/groups")
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  /** My groups + discoverable groups. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.groups.list(user);
  }

  /** A single group page. */
  @Get(":id")
  getOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.groups.getOne(user, id);
  }

  @RequireActive()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body(new ZodPipe(createGroupSchema)) body: CreateGroupInput) {
    return this.groups.create(user, body);
  }

  /** Update the group's social profile (admins only). */
  @RequireActive()
  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodPipe(updateGroupSchema)) body: UpdateGroupInput,
  ) {
    return this.groups.update(user, id, body);
  }

  @RequireActive()
  @Post(":id/join")
  join(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.groups.requestJoin(user, id);
  }

  @RequireActive()
  @Post(":id/leave")
  leave(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.groups.leave(user, id);
  }

  @RequireActive()
  @Post(":id/members/:userId/approve")
  approve(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("userId") userId: string) {
    return this.groups.approveMember(user, id, userId);
  }

  @RequireActive()
  @Post(":id/members/:userId/decline")
  decline(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("userId") userId: string) {
    return this.groups.declineMember(user, id, userId);
  }

  @RequireActive()
  @Post(":id/members/:userId/remove")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("userId") userId: string) {
    return this.groups.removeMember(user, id, userId);
  }

  @RequireActive()
  @Post(":id/members/:userId/role")
  setRole(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body(new ZodPipe(memberRoleSchema)) body: MemberRoleInput,
  ) {
    return this.groups.setRole(user, id, userId, body.role);
  }
}
