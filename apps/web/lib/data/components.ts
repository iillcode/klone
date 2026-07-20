export interface Author {
  name: string;
  avatar: string;
}

export type ComponentCategory = 'ui' | 'marketing' | 'effects';
export type ThemeCategory = 'dark' | 'light' | 'colorful';

export interface Component {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  previewImage: string;
  author: Author;
  tags: string[];
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  previewImage: string;
  author: Author;
  tags: string[];
}

export const components: Component[] = [
  {
    id: '1',
    name: 'Container Scroll Animation',
    description: 'A scroll-based animation that reveals content as you scroll down the page.',
    category: 'ui',
    previewImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=340&fit=crop',
    author: { name: 'Aceternity', avatar: 'A' },
    tags: ['animation', 'scroll'],
  },
  {
    id: '2',
    name: 'Spline Scene',
    description: 'Interactive 3D scenes using Spline embedded directly in your React app.',
    category: 'ui',
    previewImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=340&fit=crop',
    author: { name: 'Serafim', avatar: 'S' },
    tags: ['3d', 'interactive'],
  },
  {
    id: '3',
    name: 'Spotlight Card',
    description: 'Cards with a spotlight effect that follows your mouse cursor.',
    category: 'ui',
    previewImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=340&fit=crop',
    author: { name: 'Easemize', avatar: 'E' },
    tags: ['card', 'hover', 'interactive'],
  },
  {
    id: '4',
    name: 'Liquid Glass Button',
    description: 'Buttons with a liquid glass morphism effect on hover.',
    category: 'ui',
    previewImage: 'https://images.unsplash.com/photo-1627398242634-6c0b91306736?w=600&h=340&fit=crop',
    author: { name: 'Designali', avatar: 'D' },
    tags: ['button', 'glass', 'hover'],
  },
  {
    id: '5',
    name: 'Landing Hero Block',
    description: 'Modern SaaS hero section with gradient background and CTA.',
    category: 'marketing',
    previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=340&fit=crop',
    author: { name: 'Shadcn', avatar: 'S' },
    tags: ['hero', 'saas', 'landing'],
  },
  {
    id: '6',
    name: 'Feature Grid',
    description: 'Responsive grid of feature cards with icons and descriptions.',
    category: 'marketing',
    previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop',
    author: { name: 'Kokonutd', avatar: 'K' },
    tags: ['features', 'grid'],
  },
  {
    id: '7',
    name: 'Pricing Section',
    description: 'Clean pricing section with three tiers and a highlighted plan.',
    category: 'marketing',
    previewImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=340&fit=crop',
    author: { name: 'Codehagen', avatar: 'C' },
    tags: ['pricing', 'saas'],
  },
  {
    id: '8',
    name: 'Dotted Surface Shader',
    description: 'GPU-accelerated dotted surface effect with customizable colors and density.',
    category: 'effects',
    previewImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=340&fit=crop',
    author: { name: 'Shahaider', avatar: 'S' },
    tags: ['shader', 'gpu', 'dots'],
  },
  {
    id: '9',
    name: 'Aurora Background',
    description: 'Northern lights inspired animated background effect.',
    category: 'effects',
    previewImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&h=340&fit=crop',
    author: { name: 'Aceternity', avatar: 'A' },
    tags: ['background', 'aurora', 'animated'],
  },
  {
    id: '10',
    name: 'Background Paths',
    description: 'Animated SVG paths that create dynamic background patterns.',
    category: 'effects',
    previewImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&h=340&fit=crop',
    author: { name: 'Kokonutd', avatar: 'K' },
    tags: ['svg', 'animation', 'background'],
  },
];

export const themes: Theme[] = [
  {
    id: 't1',
    name: 'Midnight',
    description: 'Deep dark theme with violet accents, perfect for dashboards.',
    category: 'dark',
    previewImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=340&fit=crop',
    author: { name: 'Tokyo', avatar: 'T' },
    tags: ['dark', 'violet'],
  },
  {
    id: 't2',
    name: 'Paper',
    description: 'Clean light theme with generous spacing and soft shadows.',
    category: 'light',
    previewImage: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&h=340&fit=crop',
    author: { name: 'Nord', avatar: 'N' },
    tags: ['light', 'minimal'],
  },
  {
    id: 't3',
    name: 'Sunset',
    description: 'Vibrant warm gradient theme for playful product UIs.',
    category: 'colorful',
    previewImage: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=600&h=340&fit=crop',
    author: { name: 'Sol', avatar: 'S' },
    tags: ['gradient', 'warm'],
  },
  {
    id: 't4',
    name: 'Forest',
    description: 'Calm green-focused dark theme inspired by nature.',
    category: 'dark',
    previewImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=340&fit=crop',
    author: { name: 'Verde', avatar: 'V' },
    tags: ['dark', 'green'],
  },
  {
    id: 't5',
    name: 'Ocean',
    description: 'Cool blue palette with glassy surfaces for fintech apps.',
    category: 'light',
    previewImage: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600&h=340&fit=crop',
    author: { name: 'Blue', avatar: 'B' },
    tags: ['blue', 'glass'],
  },
  {
    id: 't6',
    name: 'Neon',
    description: 'High-contrast colorful theme with glowing edges.',
    category: 'colorful',
    previewImage: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&h=340&fit=crop',
    author: { name: 'Pulse', avatar: 'P' },
    tags: ['neon', 'glow'],
  },
];

export interface TemplateItem {
  id: number;
  title: string;
  description: string;
  image: string;
}

export const templates: TemplateItem[] = [
  {
    id: 1,
    title: 'Maison',
    description: 'Editorial home goods storefront',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=400&fit=crop',
  },
  {
    id: 2,
    title: 'Inspo Canvas',
    description: 'Spatial canvas for collecting, arranging, and sharing inspiration',
    image: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=600&h=400&fit=crop',
  },
  {
    id: 3,
    title: 'Personal blog',
    description: 'Muted, intimate design',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop',
  },
  {
    id: 4,
    title: 'Fashion blog',
    description: 'Minimal, playful design',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
  },
  {
    id: 5,
    title: 'Continuum',
    description: 'Build lasting habits, one day at a time',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop',
  },
  {
    id: 6,
    title: 'Lovable slides',
    description: 'Beautiful presentations, effortlessly',
    image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&h=400&fit=crop',
  },
  {
    id: 7,
    title: 'Prompt Frame Creative Portfolio',
    description: 'Dark-first premium aesthetic',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&h=400&fit=crop',
  },
  {
    id: 8,
    title: 'Ecommerce Store Website Template',
    description: 'Premium design for webstore',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=400&fit=crop',
  },
];
