import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Post, PostDocument } from "src/posts/models/post.schema";
import { UserDto } from "src/users/dto/users.dto";
import { Comment, CommentDocument } from "./models/comment.schema";

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async findPostComments(postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new ForbiddenException(`Can't find this post`);
    }

    return await this.commentModel.find({ postId: postId }).exec();
  }

  async create(owner: string, postId: string, commentContent: string) {
    const newComment = new this.commentModel({
      owner,
      postId,
      commentContent,
    });

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new ForbiddenException(`Can't find this post`);
    }

    post.comments.push(newComment._id);
    await post.save();

    await newComment.save();

    return newComment.populate({ path: "owner", select: "name avatar _id" });
  }

  async update(userId: string, commentId: string, commentContent: string) {
    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment) {
      throw new ForbiddenException(`Can't find this Comment`);
    }

    if (userId !== comment.owner.toString()) {
      throw new ForbiddenException(`You are not the owner of this comment`);
    }

    comment.commentContent = commentContent;
    await comment.save();
    return comment;
  }

  async delete(userId: string, commentId: string) {
    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment) {
      throw new ForbiddenException(`Can't find this Comment`);
    }

    if (userId !== comment.owner.toString()) {
      throw new ForbiddenException(`You are not the owner of this comment`);
    }

    let commentIndex = null;
    const post = await this.postModel.findById(comment.postId).exec();
    post.comments.forEach((id, index) => {
      if (id.toString() === commentId) {
        commentIndex = index;
      }
    });

    post.comments.splice(commentIndex, 1);
    await post.save();

    return await comment.delete();
  }

  async like(user: UserDto, commentId: string) {
    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment) {
      throw new ForbiddenException(`Can't find this Comment`);
    }

    const filter = comment.whoLike.filter((userId1) => {
      return userId1.toString() === user._id.toString();
    });

    if (filter.length !== 0) {
      comment.whoLike = comment.whoLike.filter((userId1) => {
        return userId1.toString() !== user._id.toString();
      });
    } else {
      comment.whoLike.push(user._id);
    }

    await comment.save();

    return { whoLike: comment.whoLike };
  }
}
