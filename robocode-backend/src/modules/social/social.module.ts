import { Module } from "@nestjs/common";
import { SocialAccessService } from "./social-access.service";
import { FriendsController } from "./friends.controller";
import { FriendsService } from "./friends.service";
import { FollowsController } from "./follows.controller";
import { FollowsService } from "./follows.service";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { PeopleController } from "./people.controller";
import { PeopleService } from "./people.service";
import { FeedService } from "./feed.service";

@Module({
  controllers: [FriendsController, FollowsController, GroupsController, PostsController, PeopleController],
  providers: [
    SocialAccessService,
    FriendsService,
    FollowsService,
    GroupsService,
    PostsService,
    PeopleService,
    FeedService,
  ],
})
export class SocialModule {}
