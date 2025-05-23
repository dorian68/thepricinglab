
import { BlogPost } from "@/types/blog";
import { monteCarloVsBinomialPost } from "./monte-carlo-vs-binomial-post";
import { quantInterviewQuestionsPost } from "./quant-interview-questions-post";
import { exoticOptionsGuidePost } from "./exotic-options-guide-post";
import { impliedVolatilityPost } from "./implied-volatility-post";
import { yieldCurvesGuidePost } from "./yield-curves-guide-post";
import { greeksExplainedPost } from "./greeks-explained-post";
import { volProductsPost } from "./vol-products-post";

export const blogPosts: BlogPost[] = [
  monteCarloVsBinomialPost,
  quantInterviewQuestionsPost,
  exoticOptionsGuidePost,
  impliedVolatilityPost,
  yieldCurvesGuidePost,
  greeksExplainedPost,
  volProductsPost
];
