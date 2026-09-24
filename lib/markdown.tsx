import type { ReactNode } from 'react';
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { TocItem } from '@/components/writing/table-of-contents';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[*_`~]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function textFromChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return textFromChildren((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

function buildToc(markdown: string): TocItem[] {
  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .flatMap((line) => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
      if (!match) return [];
      const text = match[2]!.replace(/\[([^\]]+)]\([^)]+\)/g, '$1').replace(/[*_`~]/g, '');
      return [{ id: slugify(text), text, level: match[1]!.length as 2 | 3 }];
    });
}

const components: Components = {
  h2({ children }) {
    return <h2 id={slugify(textFromChildren(children))}>{children}</h2>;
  },
  h3({ children }) {
    return <h3 id={slugify(textFromChildren(children))}>{children}</h3>;
  },
  a({ href, children }) {
    const external = href?.startsWith('http://') || href?.startsWith('https://');
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    );
  },
  img({ src, alt, title }) {
    return (
      <span className="my-8 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ''} loading="lazy" className="h-auto w-full rounded-md" />
        {title && <span className="mt-2 block text-center text-sm italic text-muted-foreground">{title}</span>}
      </span>
    );
  },
};

export function renderMarkdown(markdown: string): { html: ReactNode; toc: TocItem[] } {
  return {
    toc: buildToc(markdown),
    html: (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
        urlTransform={defaultUrlTransform}
      >
        {markdown}
      </ReactMarkdown>
    ),
  };
}
