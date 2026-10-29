export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  status: "draft" | "published";
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};
export type PostInput = Pick<BlogPost, "title" | "slug" | "excerpt" | "category" | "status" | "version"> & { content: string };
export type PostPage = { posts: BlogPost[]; hasMore: boolean };
