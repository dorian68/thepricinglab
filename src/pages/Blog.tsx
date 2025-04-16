
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Tag, Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { blogPosts } from "@/data/blog-posts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const featuredTags = ["Options", "Black-Scholes", "Monte Carlo", "Volatility", "Quant Interview", "Python"];

const Blog = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeTag, setActiveTag] = React.useState<string | null>(null);

  const filteredPosts = React.useMemo(() => {
    let filtered = [...blogPosts];
    
    if (searchTerm) {
      filtered = filtered.filter(
        post => 
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (activeTag) {
      filtered = filtered.filter(post => 
        post.tags.includes(activeTag)
      );
    }
    
    return filtered;
  }, [searchTerm, activeTag, blogPosts]);

  const handleTagClick = (tag: string) => {
    setActiveTag(prevTag => prevTag === tag ? null : tag);
  };
  
  const resetFilters = () => {
    setSearchTerm("");
    setActiveTag(null);
  };

  return (
    <>
      <Helmet>
        <title>{t("blog.title")} | The Pricing Lab</title>
        <meta name="description" content={t("blog.description")} />
        <meta name="keywords" content="quantitative finance, options pricing, Black-Scholes, Monte Carlo, volatility surface, quant interview" />
        <link rel="canonical" href="https://thepricinglab.com/blog" />
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} to="/">
                {t("navbar.home")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("blog.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("blog.title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("blog.subtitle")}
          </p>
        </div>
        
        {/* Search & Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("blog.search")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {featuredTags.map((tag) => (
              <Badge
                key={tag}
                variant={activeTag === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
            
            {(searchTerm || activeTag) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="ml-2"
              >
                {t("blog.clearFilters")}
              </Button>
            )}
          </div>
        </div>
        
        {/* Featured Post */}
        {filteredPosts.length > 0 && !searchTerm && !activeTag && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{t("blog.featuredPost")}</h2>
            <Link to={`/blog/${filteredPosts[0].slug}`} className="block">
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img 
                    src={filteredPosts[0].coverImage} 
                    alt={filteredPosts[0].title}
                    className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex gap-2 mb-2">
                    {filteredPosts[0].tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">{filteredPosts[0].title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{filteredPosts[0].excerpt}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{filteredPosts[0].readingTime} min read</span>
                  </div>
                  <div className="flex items-center font-medium">
                    {t("blog.readMore")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardFooter>
              </Card>
            </Link>
          </div>
        )}
        
        {/* All Posts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {searchTerm || activeTag ? t("blog.searchResults") : t("blog.allPosts")}
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">{t("blog.noResults")}</h3>
              <p className="text-muted-foreground">{t("blog.tryDifferent")}</p>
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="mt-4"
              >
                {t("blog.viewAllPosts")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.slice(searchTerm || activeTag ? 0 : 1).map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="block">
                  <Card className="h-full flex flex-col transition-all hover:shadow-md">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img 
                        src={post.coverImage} 
                        alt={post.title}
                        className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                    <CardHeader className="flex-grow">
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-muted-foreground line-clamp-3 text-sm">
                        {post.excerpt}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>{post.readingTime} min read</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Tags Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t("blog.browseTags")}</h2>
            <Tag className="h-5 w-5" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(blogPosts.flatMap(post => post.tags))).sort().map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Newsletter */}
        <div className="mb-12 bg-muted p-8 rounded-lg">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">{t("blog.newsletter.title")}</h2>
            <p className="mb-6">{t("blog.newsletter.description")}</p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder={t("blog.newsletter.placeholder")}
                className="flex-grow"
              />
              <Button>{t("blog.newsletter.subscribe")}</Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Blog;
