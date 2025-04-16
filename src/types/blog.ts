
export type BlogAuthor = {
  name: string;
  bio: string;
  avatar: string;
  social?: {
    twitter?: string;
    linkedin?: string;
  };
};

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: BlogAuthor;
  coverImage: string;
  tags: string[];
  date: string;
  readingTime: number;
  relatedCourse?: string;
};
