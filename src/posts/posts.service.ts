import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserDto } from "src/users/dto/users.dto";
import { User, UserDocument } from "src/users/models/user.schema";
import { Post, PostDocument } from "./models/post.schema";

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private UserModule: Model<UserDocument>,
  ) {}

  async findAll() {
    return await this.postModel.find().exec();
  }

  async findById(id: string) {
    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new ForbiddenException();
    }

    return post;
  }

  async findAllUserPosts(userId: string) {
    const posts = await this.postModel.find({ owner: userId });
    return posts;
  }

  async create(owner: string, postContent: string): Promise<Post> {
    const newPost = new this.postModel({
      owner,
      postContent,
    });

    const user = await this.UserModule.findById(owner).exec();
    user.posts.push(newPost._id);
    user.save();

    return newPost.save();
  }

  async update(user: UserDto, id: string, postContent: string) {
    const post = await this.findById(id);

    if (!post) {
      throw new ForbiddenException();
    }

    if (post.owner.toString() !== user._id.toString()) {
      throw new ForbiddenException();
    }

    post.postContent = postContent;
    await post.save();

    return post;
  }

  async delete(user: UserDto, id: string) {
    const post = await this.findById(id);
    if (post.owner.toString() !== user._id.toString()) {
      throw new ForbiddenException();
    }

    const updateUser = await this.UserModule.findById(user._id.toString());
    let postIndex = null;

    updateUser.posts.forEach((postId, index) => {
      if (postId.toString() === id) {
        postIndex = index;
      }
    });

    updateUser.posts.splice(postIndex, 1);
    await updateUser.save();

    return await post.delete();
  }

  async like(user: UserDto, id: string) {
    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new ForbiddenException();
    }

    let likeIndex = null;

    const filter = post.whoLike.filter((userId, index) => {
      likeIndex = index;
      return userId.toString() === user._id.toString();
    });

    if (filter.length !== 0) {
      post.likes--;
      post.whoLike.splice(likeIndex, 1);
    } else {
      post.whoLike.push(user._id);
      post.likes++;
    }
    await post.save();

    return post;
  }
}
