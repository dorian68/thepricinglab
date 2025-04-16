
import { BlogPost } from "@/types/blog";
import { blackScholesPost } from "./black-scholes-post";
import { monteCarloVsBinomialPost } from "./monte-carlo-vs-binomial-post";
import { quantInterviewQuestionsPost } from "./quant-interview-questions-post";
import { exoticOptionsGuidePost } from "./exotic-options-guide-post";
import { impliedVolatilityPost } from "./implied-volatility-post";

export const blogPosts: BlogPost[] = [
  blackScholesPost,
  monteCarloVsBinomialPost,
  quantInterviewQuestionsPost,
  exoticOptionsGuidePost,
  impliedVolatilityPost
];
