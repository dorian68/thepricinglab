import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft, 
  Share2, 
  Linkedin, 
  Facebook, 
  Twitter, 
  Copy, 
  ArrowRight,
  Clock,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { blogPosts } from "@/data/blog-posts";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const post = React.useMemo(() => 
    blogPosts.find(post => post.slug === slug), 
    [slug]
  );

  const relatedPosts = React.useMemo(() => {
    if (!post) return [];
    
    return blogPosts
      .filter(p => p.id !== post.id)
      .map(p => {
        const matchingTags = p.tags.filter(tag => post.tags.includes(tag)).length;
        return { ...p, matchingTags };
      })
      .sort((a, b) => b.matchingTags - a.matchingTags)
      .slice(0, 3);
  }, [post]);

  return (
    <>
      <Helmet>
        <title>{post?.title || 'Blog Post'} | The Pricing Lab Blog</title>
        <meta name="description" content={post?.excerpt} />
        <meta name="keywords" content={post?.tags?.join(", ")} />
        <meta property="og:title" content={post?.title} />
        <meta property="og:description" content={post?.excerpt} />
        <meta property="og:image" content={post?.coverImage} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://thepricinglab.com/blog/${post?.slug}`} />
      </Helmet>
      
      <Navbar />
      
      {!post ? (
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">{t("blog.postNotFound")}</h1>
          <p className="mb-6 text-muted-foreground">{t("blog.postNotFoundDesc")}</p>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("blog.backToBlog")}
          </Button>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink>
                  <Link to="/">{t("navbar.home")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>
                  <Link to="/blog">{t("blog.title")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{post.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="mb-12">
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-mono">
              {post.title}
            </h1>
            
            <div className="flex items-center justify-between mb-8 p-4 bg-card rounded-lg border border-border/50">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.author.name}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span className="mr-3">{post.date}</span>
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{post.readingTime} min read</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={shareOnTwitter}>
                        <Twitter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("blog.shareOnTwitter")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={shareOnLinkedIn}>
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("blog.shareOnLinkedIn")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={shareOnFacebook}>
                        <Facebook className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("blog.shareOnFacebook")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("blog.copyLink")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          
          <div className="mb-12 rounded-xl overflow-hidden border border-border/50 shadow-lg">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full object-cover aspect-video"
            />
          </div>
          
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12 
            prose-headings:font-mono prose-headings:font-bold
            prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-base prose-p:leading-relaxed prose-p:mb-6
            prose-pre:bg-card prose-pre:border prose-pre:border-border/50
            prose-pre:rounded-lg prose-pre:p-4 prose-pre:shadow-md
            prose-pre:font-mono prose-pre:text-sm
            prose-code:font-mono prose-code:text-primary
            prose-strong:font-semibold prose-strong:text-primary
            prose-blockquote:border-l-4 prose-blockquote:border-primary
            prose-blockquote:pl-4 prose-blockquote:italic
            prose-ul:list-disc prose-ul:pl-6
            prose-ol:list-decimal prose-ol:pl-6
            prose-li:mb-2
            prose-table:border-collapse prose-table:w-full
            prose-th:border prose-th:border-border/50 prose-th:p-2 prose-th:bg-muted
            prose-td:border prose-td:border-border/50 prose-td:p-2
            prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
          
          <div className="bg-card p-8 rounded-xl border border-border/50 shadow-lg mb-12">
            <div className="flex items-start">
              <Avatar className="h-16 w-16 mr-6">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold mb-2">{post.author.name}</h3>
                <p className="text-muted-foreground mb-3">{post.author.bio}</p>
                <div className="flex space-x-2">
                  {post.author.social?.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={post.author.social.twitter} target="_blank" rel="noreferrer">
                        <Twitter className="h-4 w-4 mr-1" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {post.author.social?.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={post.author.social.linkedin} target="_blank" rel="noreferrer">
                        <Linkedin className="h-4 w-4 mr-1" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {relatedPosts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{t("blog.relatedPosts")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link to={`/blog/${relatedPost.slug}`} key={relatedPost.id}>
                    <Card className="h-full flex flex-col hover:shadow-md transition-all">
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <img 
                          src={relatedPost.coverImage} 
                          alt={relatedPost.title}
                          className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                        />
                      </div>
                      <CardHeader className="flex-grow">
                        <CardTitle className="line-clamp-2">{relatedPost.title}</CardTitle>
                      </CardHeader>
                      <CardFooter className="pt-0">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{relatedPost.readingTime} min read</span>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between mb-8 mt-12">
            <Button variant="outline" asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("blog.backToBlog")}
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to={post.relatedCourse ? `/courses/${post.relatedCourse}` : "/courses"}>
                {t("blog.exploreCourses")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </main>
      )}
    </>
  );
};

export default BlogPost;
