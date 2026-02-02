
import React from 'react';
import { Target, HelpCircle, Layout, Box, Zap, Search, AlertCircle, CheckCircle, BrainCircuit } from 'lucide-react';

interface ParsedSection {
    title: string;
    icon: React.FC<any>;
    content: string;
    color: string;
    collapsible?: boolean;
}

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css'; // Dark theme for code blocks

import { MessageSquare } from 'lucide-react';

// ... (ParsedSection interface remains same)

export const MessageRenderer: React.FC<{ content: string }> = ({ content }) => {
    // ... (Regex parsing remains the same)

    // Helper to render markdown content
    const MarkdownContent = ({ text }: { text: string }) => (
        <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={{
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                        <div className="rounded-lg overflow-hidden my-2 border border-white/10">
                            <div className="bg-white/5 px-4 py-1 text-xs text-gray-400 border-b border-white/10 flex justify-between">
                                <span>{match[1]}</span>
                            </div>
                            <code className={className} {...props}>
                                {children}
                            </code>
                        </div>
                    ) : (
                        <code className="bg-white/10 rounded px-1 py-0.5 text-sm font-mono text-cyan-200" {...props}>
                            {children}
                        </code>
                    )
                },
                p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-4 space-y-1">{children}</ol>,
                h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-bold mb-2 mt-3 text-white">{children}</h3>,
                a: ({ children, href }) => <a href={href} className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-cyan-500 pl-4 py-1 my-2 bg-white/5 italic">{children}</blockquote>
            }}
        >
            {text}
        </ReactMarkdown>
    );

    // Regex to find sections like [TITLE] ... content ...
    const sectionRegex = /\[([A-Z]+)\]\s*([\s\S]*?)(?=\[\w+\]|$)/g;

    const sections: ParsedSection[] = [];
    let match;
    // ... (Parsing logic remains same)

    // Check if content starts with regular text (before any tag)
    const firstTagIndex = content.search(/\[[A-Z]+\]/);
    if (firstTagIndex > 0) {
        sections.push({
            title: 'Note',
            icon: MessageSquare,
            content: content.substring(0, firstTagIndex),
            color: 'text-gray-400'
        });
    } else if (firstTagIndex === -1 && content.trim().length > 0) {
        // No tags at all - Render as proper Markdown
        return <div className="text-gray-200"><MarkdownContent text={content} /></div>;
    }

    while ((match = sectionRegex.exec(content)) !== null) {
        // ... (Tag parsing logic remains same)
    }

    return (
        <div className="space-y-4">
            {sections.map((section, idx) => {
                const Icon = section.icon;

                if (section.collapsible) {
                    // ... (Collapsible logic)
                    return (
                        <details key={idx} className="group border border-white/5 rounded-lg bg-white/[0.02] overflow-hidden">
                            <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none hover:bg-white/5 transition-colors">
                                <Icon className={`w-4 h-4 ${section.color}`} />
                                <span className={`text-xs font-semibold uppercase tracking-wider ${section.color}`}>{section.title}</span>
                                <div className="ml-auto opacity-50 text-[10px] uppercase">{section.title === 'Thinking Process' ? 'Click to view' : ''}</div>
                            </summary>
                            <div className="px-3 py-2 border-t border-white/5 text-xs font-mono text-gray-500 whitespace-pre-wrap leading-tight bg-black/20">
                                {section.content}
                            </div>
                        </details>
                    );
                }

                return (
                    <div key={idx} className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${section.color}`} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${section.color}`}>{section.title}</span>
                        </div>
                        <div className={`pl-4 border-l-2 border-white/5 ${section.color.replace('text-', 'border-').replace('400', '900')}`}>
                            {/* Use MarkdownContent instead of raw text */}
                            <div className="text-gray-300">
                                <MarkdownContent text={section.content} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
