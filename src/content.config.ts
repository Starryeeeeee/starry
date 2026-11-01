import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    // 稳定内容 ID：创建时生成，改名/迁移都不变（giscus、点赞、AI 索引都关联到它）
    id: z.string().optional(),
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['draft', 'public', 'archived']).default('public'),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const skills = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/skills' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

// 知识库·手写条目：定理、公式、解题技巧等纯文字内容（markdown，支持 $...$ 数学公式）
// 上传的文档类资源（pdf/word/ppt）走 src/data/kb-files.json，见 src/lib/kb.ts
const kb = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kb' }),
  schema: z.object({
    // 稳定内容 ID：同 posts
    id: z.string().optional(),
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().default(''),
    subject: z.string().default('未分类'),
    tags: z.array(z.string()).default([]),
    status: z.enum(['draft', 'public', 'archived']).default('public'),
    /**
     * 访问级别：
     * - public：列表、搜索、AI 索引都可见
     * - personal：不进列表、不进 AI 索引，靠直链访问（给自己留的）
     * - private：完全不构建，只在本地源文件里存在
     * 过滤一律发生在数据层，不靠提示词嘱咐模型「别说出去」。
     */
    access: z.enum(['public', 'personal', 'private']).default('public'),
  }),
});

const changelog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/changelog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

export const collections = { posts, projects, skills, kb, changelog };
