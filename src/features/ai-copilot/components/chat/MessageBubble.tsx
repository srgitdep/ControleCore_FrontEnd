import { useState } from 'react';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { HitlActionCard } from './HitlActionCard';

interface MessageBubbleProps {
  msg: any;
  idx: number;
}

export function MessageBubble({ msg, idx }: MessageBubbleProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const isUser = msg.role === 'user';

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${
          isUser
            ? 'bg-slate-200 text-slate-600'
            : 'bg-indigo-100 text-indigo-600'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>
      <div
        className={`p-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
            : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="relative group">
            <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-th:bg-slate-50 prose-th:p-2 prose-td:p-2 prose-table:border prose-table:rounded-lg prose-table:overflow-hidden prose-tr:border-b pr-6">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => {
                    const href = props.href || '#';
                    // External links open in new tab, internal links use react-router-dom
                    if (href.startsWith('http') || href.startsWith('mailto')) {
                      return <a {...props} className="text-indigo-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer" />;
                    }
                    return <Link to={href} className="text-indigo-600 hover:underline font-medium">{props.children}</Link>;
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
            <button
              onClick={() => handleCopy(msg.content, idx)}
              className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Copiar texto"
            >
              {copiedId === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
        
        {/* Cartão de Ação (HITL) */}
        {msg.hitlAction && <HitlActionCard hitlAction={msg.hitlAction} />}
      </div>
    </div>
  );
}
