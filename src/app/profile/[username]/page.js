'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Heart, Loader2, ExternalLink, FileText, Edit3, Trash2, MessageCircle, Pin, Send, CheckCircle, AlertCircle, X, Check, Eye, EyeOff, Rocket, Settings, GripVertical, Plus, LayoutTemplate, SquareUser, Camera, ImageIcon, Upload, Share2, ChevronUp, ChevronDown, Hammer, Lightbulb, BookOpen, Palette, FlaskConical, PenTool, Target, Zap, Sprout } from 'lucide-react';
import Feather from '@/components/shared/FeatherIcon';
import { formatNumber, timeAgo, truncate, getPostExcerpt } from '@/lib/utils';

import DashboardLayout from '@/app/dashboard/layout';

/* ─── Professional SVG Icons for Social Platforms ─── */
const SocialSvg = {
  twitter: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  github: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>,
  linkedin: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  website: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  youtube: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  instagram: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  dribbble: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.81zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702C16.86 2.61 14.545 1.62 12 1.62c-.824 0-1.63.11-2.4.315v.12zm10.335 3.483c-.218.29-1.91 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/></svg>,
  medium: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>,
  tiktok: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  stackoverflow: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.65l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154z"/></svg>,
  discord: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
  threads: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.26 1.33-3.017.88-.724 2.107-1.127 3.461-1.137 1.012-.008 1.928.142 2.736.449.02-.94-.09-1.792-.328-2.546l1.964-.562c.327 1.04.478 2.263.443 3.58l.007.003c.832.46 1.504 1.075 1.957 1.838.638 1.076.95 2.456.834 3.96a6.18 6.18 0 01-.102.737c-.386 1.997-1.476 3.607-3.148 4.647C17.474 23.343 15.15 23.988 12.186 24zm.378-7.6c-.96.052-1.762.364-2.258.88-.37.385-.56.856-.536 1.325.038.697.452 1.263 1.165 1.596.588.275 1.32.397 2.076.36 1.107-.06 1.95-.451 2.504-1.14.496-.616.833-1.491.986-2.584a8.89 8.89 0 00-3.937-.437z"/></svg>,
};

const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/username', color: '#000000' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username', color: '#333333' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username', color: '#0A66C2' },
  { key: 'website', label: 'Website', placeholder: 'https://yoursite.com', color: '#6366f1' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel', color: '#FF0000' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username', color: '#E4405F' },
  { key: 'dribbble', label: 'Dribbble', placeholder: 'https://dribbble.com/username', color: '#EA4C89' },
  { key: 'medium', label: 'Medium', placeholder: 'https://medium.com/@username', color: '#000000' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username', color: '#000000' },
  { key: 'stackoverflow', label: 'Stack Overflow', placeholder: 'https://stackoverflow.com/users/id', color: '#F58025' },
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/invite', color: '#5865F2' },
  { key: 'threads', label: 'Threads', placeholder: 'https://threads.net/@username', color: '#000000' },
];

const resolveSocialIcon = (key, url) => {
  if (SocialSvg[key]) {
    const platform = SOCIAL_PLATFORMS.find(p => p.key === key);
    return {
      Icon: SocialSvg[key],
      color: platform?.color || 'var(--color-text-secondary)',
      label: platform?.label || key
    };
  }
  
  if (url) {
    const lowercaseUrl = url.toLowerCase();
    for (const p of SOCIAL_PLATFORMS) {
      if (lowercaseUrl.includes(p.key === 'twitter' ? 'x.com' : p.key) || (p.key === 'twitter' && lowercaseUrl.includes('twitter.com'))) {
        return {
          Icon: SocialSvg[p.key],
          color: p.color,
          label: p.label
        };
      }
    }
    if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.com')) {
      return {
        Icon: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
        color: '#1877F2',
        label: 'Facebook'
      };
    }
    if (lowercaseUrl.includes('twitch.tv')) {
      return {
        Icon: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>,
        color: '#9146FF',
        label: 'Twitch'
      };
    }
    if (lowercaseUrl.includes('reddit.com')) {
      return {
        Icon: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-.521 1.012c.045.22.072.443.072.67 0 2.505-3.033 4.542-6.777 4.542-3.743 0-6.776-2.037-6.776-4.542 0-.227.027-.45.072-.67a1.251 1.251 0 0 1-.521-1.012c0-.688.561-1.25 1.25-1.25.437 0 .822.228 1.045.571 1.348-.925 3.178-1.517 5.176-1.583l1.096-2.457 3.013.673a1.04 1.04 0 0 1-.027.235c0 .571.465 1.034 1.037 1.034a1.036 1.036 0 0 1 1.037-1.034 1.036 1.036 0 0 1-1.037-1.035c-.437 0-.81.272-.964.654l-3.21-.716-.99 2.217c2.037.052 3.9.645 5.27 1.583a1.246 1.246 0 0 1 1.012-.444z"/></svg>,
        color: '#FF4500',
        label: 'Reddit'
      };
    }
    if (lowercaseUrl.includes('slack.com')) {
      return {
        Icon: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.522 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.043zm10.135 3.76a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522h-2.522v-2.522zm-1.262 0a2.528 2.528 0 0 1-2.52 2.522h-5.043a2.528 2.528 0 0 1-2.522-2.522V3.78a2.528 2.528 0 0 1 2.522-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043zm-3.78 10.134a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522v5.043h-5.043z"/></svg>,
        color: '#4A154B',
        label: 'Slack'
      };
    }
    if (lowercaseUrl.includes('patreon.com')) {
      return {
        Icon: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><path d="M0 .008h4.137v23.99H0V.008zm15.18 0c-4.88 0-8.835 3.95-8.835 8.83 0 4.878 3.955 8.83 8.835 8.83 4.879 0 8.82-3.952 8.82-8.83 0-4.88-3.941-8.83-8.82-8.83z"/></svg>,
        color: '#FF424D',
        label: 'Patreon'
      };
    }
    
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname.replace('www.', '');
      const dotIndex = hostname.indexOf('.');
      let cleanLabel = dotIndex > 0 ? hostname.substring(0, dotIndex) : hostname;
      cleanLabel = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);
      return {
        Icon: (p) => <ExternalLink size={p.size||16} />,
        color: 'var(--color-text-secondary)',
        label: cleanLabel
      };
    } catch {}
  }
  
  let labelFallback = key;
  try {
    labelFallback = key.charAt(0).toUpperCase() + key.slice(1);
  } catch {}
  
  return {
    Icon: (p) => <ExternalLink size={p.size||16} />,
    color: 'var(--color-text-secondary)',
    label: labelFallback
  };
};



const STATUS_ICONS = {
  'hammer': { icon: Hammer, color: '#eab308', emoji: '🔨' },
  'rocket': { icon: Rocket, color: '#3b82f6', emoji: '🚀' },
  'idea': { icon: Lightbulb, color: '#f59e0b', emoji: '💡' },
  'books': { icon: BookOpen, color: '#10b981', emoji: '📚' },
  'palette': { icon: Palette, color: '#ec4899', emoji: '🎨' },
  'flask': { icon: FlaskConical, color: '#8b5cf6', emoji: '🧪' },
  'writing': { icon: PenTool, color: '#f97316', emoji: '✍️' },
  'target': { icon: Target, color: '#ef4444', emoji: '🎯' },
  'bolt': { icon: Zap, color: '#eab308', emoji: '⚡' },
  'sprout': { icon: Sprout, color: '#22c55e', emoji: '🌱' },
};

const renderStatusIcon = (statusEmojiOrKey, size = 14) => {
  const entry = Object.entries(STATUS_ICONS).find(([key, val]) => key === statusEmojiOrKey || val.emoji === statusEmojiOrKey);
  if (entry) {
    const IconComp = entry[1].icon;
    return <IconComp size={size} style={{ color: entry[1].color }} className="shrink-0" />;
  }
  return <span className="text-xs mr-0.5">{statusEmojiOrKey}</span>;
};

function ProfileContent({ profile, posts, pinnedPosts, isOwn, currentUser, isFollowing, handleFollow }) {
  const savedDesign = profile.profileDesign || {
    template: 'default',
    tabs: { articles: true, about: true }
  };

  const [editorOpen, setEditorOpen] = useState(false);
  // Editor state — declared early so we can derive live tab visibility
  const [editorDesignState, setEditorDesignState] = useState({
    template: savedDesign.template || 'default',
    tabs: {
      articles: savedDesign.tabs?.articles ?? true,
      about: savedDesign.tabs?.about ?? true,
      projects: savedDesign.tabs?.projects ?? true,
      social: savedDesign.tabs?.social ?? true,
      contact: savedDesign.tabs?.contact ?? true,
      experience: savedDesign.tabs?.experience ?? false,
    },
    tabOrder: savedDesign.tabOrder || ['articles', 'social', 'contact'],
    customTabs: savedDesign.customTabs || [],
  });

  const [customUrl, setCustomUrl] = useState('');

  const handleAddCustomLink = () => {
    const url = customUrl.trim();
    if (!url) return;
    
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    
    let key = 'link_' + Date.now();
    try {
      const hostname = new URL(targetUrl).hostname.replace('www.', '').toLowerCase();
      const parts = hostname.split('.');
      if (parts.length > 1) {
        key = parts[0];
      } else {
        key = hostname;
      }
    } catch {}
    
    let uniqueKey = key;
    let count = 1;
    while (editorForm.socialLinks && editorForm.socialLinks[uniqueKey] !== undefined) {
      uniqueKey = `${key}_${count}`;
      count++;
    }
    
    setEditorForm(f => ({
      ...f,
      socialLinks: {
        ...f.socialLinks,
        [uniqueKey]: targetUrl
      }
    }));
    setCustomUrl('');
  };

  // Use editorDesign when editing, saved design otherwise
  const liveDesign = (isOwn && editorOpen) ? editorDesignState : savedDesign;
  const template = liveDesign.template || 'default';
  const showArticles = liveDesign.tabs?.articles ?? true;
  const showContact = liveDesign.tabs?.contact ?? true;
  const showSocial = liveDesign.tabs?.social ?? true;
  const customTabs = (liveDesign.customTabs || []).filter(t => t.visible !== false);

  // Helper to get all available tabs in correct order
  const getOrderedTabsList = useCallback(() => {
    const defaultOrder = ['articles', 'social', 'contact'];
    const savedOrder = liveDesign.tabOrder || [];
    
    // Custom tabs that actually exist
    const currentCustomTabs = liveDesign.customTabs || [];
    const customTabIds = currentCustomTabs.map(t => t.id);
    
    // Combine saved order and default order, filtering out duplicates
    const combinedOrder = Array.from(new Set([...savedOrder, ...defaultOrder]));
    
    // Filter to keep only built-in IDs and existing custom tab IDs
    const validIds = combinedOrder.filter(id => 
      id === 'articles' || id === 'social' || id === 'contact' || customTabIds.includes(id)
    );
    
    // Append any existing custom tabs that aren't in the order list yet
    const missingCustomIds = customTabIds.filter(id => !validIds.includes(id));
    return [...validIds, ...missingCustomIds];
  }, [liveDesign.tabOrder, liveDesign.customTabs]);

  const moveTab = (index, direction) => {
    const tabs = getOrderedTabsList();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tabs.length) return;
    
    const updated = [...tabs];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    
    setEditorDesignState(d => ({
      ...d,
      tabOrder: updated
    }));
  };

  const getFirstVisibleTab = () => {
    const ordered = savedDesign.tabOrder || ['articles', 'social', 'contact'];
    const showArticles = savedDesign.tabs?.articles ?? true;
    const showSocial = savedDesign.tabs?.social ?? true;
    const showContact = savedDesign.tabs?.contact ?? true;
    const customTabs = savedDesign.customTabs || [];
    
    const combined = Array.from(new Set([...ordered, 'articles', 'social', 'contact']));
    const customTabIds = customTabs.map(t => t.id);
    const valid = combined.filter(id => 
      id === 'articles' || id === 'social' || id === 'contact' || customTabIds.includes(id)
    );
    const missing = customTabIds.filter(id => !valid.includes(id));
    const fullOrder = [...valid, ...missing];
    
    const isVisible = (id) => {
      if (id === 'articles') return showArticles;
      if (id === 'social') return showSocial;
      if (id === 'contact') return showContact;
      const ct = customTabs.find(t => t.id === id);
      return ct ? (ct.visible !== false) : false;
    };
    
    return fullOrder.find(isVisible) || 'articles';
  };
  
  const [activeTab, setActiveTab] = useState(getFirstVisibleTab());

  // Auto-switch active tab when current one gets hidden
  useEffect(() => {
    const ordered = getOrderedTabsList();
    const showArticles = liveDesign.tabs?.articles ?? true;
    const showSocial = liveDesign.tabs?.social ?? true;
    const showContact = liveDesign.tabs?.contact ?? true;
    const customTabs = liveDesign.customTabs || [];
    
    const isVisible = (id) => {
      if (id === 'articles') return showArticles;
      if (id === 'social') return showSocial;
      if (id === 'contact') return showContact;
      const ct = customTabs.find(t => t.id === id);
      return ct ? (ct.visible !== false) : false;
    };
    
    if (!isVisible(activeTab)) {
      const first = ordered.find(isVisible) || null;
      setActiveTab(first);
    }
  }, [liveDesign.tabs, liveDesign.customTabs, liveDesign.tabOrder, activeTab, getOrderedTabsList]);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSending(true);
    setContactError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: profile._id,
          senderName: contactForm.name,
          senderEmail: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setContactSent(true);
    } catch (err) {
      setContactError(err.message);
    } finally {
      setContactSending(false);
    }
  };

  // ── Editor sidebar state ──
  const [editorTab, setEditorTab] = useState('profile');
  const [editorForm, setEditorForm] = useState({
    name: profile.name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    about: profile.about || '',
    socialLinks: profile.socialLinks || {},
    contactDetails: profile.contactDetails || { publicEmail: '', message: '' },
    currentStatus: profile.currentStatus || { text: '', emoji: '🔨' },
  });
  const [newTabName, setNewTabName] = useState('');
  const [editingTabId, setEditingTabId] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false);
  const [confirmRemoveCover, setConfirmRemoveCover] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    const isAvatar = type === 'avatar';
    isAvatar ? setUploadingAvatar(true) : setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', isAvatar ? 'avatars' : 'covers');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        // Save immediately to the profile
        await fetch('/api/users/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [type]: data.url }),
        });
        window.location.reload();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingCover(false);
    }
  };
  const handleRemoveImage = async (type) => {
    try {
      await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: '' }),
      });
      window.location.reload();
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorSuccess, setEditorSuccess] = useState('');
  const [panelWidth, setPanelWidth] = useState(420);
  const isResizing = useRef(false);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;
    const onMove = (ev) => {
      if (!isResizing.current) return;
      const delta = startX - ev.clientX;
      setPanelWidth(Math.min(Math.max(startWidth + delta, 320), 700));
    };
    const onUp = () => { isResizing.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  const addCustomTab = () => {
    const name = newTabName.trim();
    if (!name || name.length > 30) return;
    const id = 'custom_' + Date.now();
    setEditorDesignState(d => ({ ...d, customTabs: [...(d.customTabs || []), { id, label: name, content: '', posts: [], visible: true }] }));
    setNewTabName('');
    setEditingTabId(id);
  };

  const togglePostInTab = (tabId, postId) => {
    setEditorDesignState(d => ({ ...d, customTabs: (d.customTabs || []).map(t => {
      if (t.id !== tabId) return t;
      const has = (t.posts || []).includes(postId);
      return { ...t, posts: has ? (t.posts || []).filter(p => p !== postId) : [...(t.posts || []), postId] };
    })}));
  };

  const removeCustomTab = (tabId) => {
    setEditorDesignState(d => ({ ...d, customTabs: (d.customTabs || []).filter(t => t.id !== tabId) }));
    if (editingTabId === tabId) setEditingTabId(null);
  };

  const updateCustomTab = (tabId, field, value) => {
    setEditorDesignState(d => ({ ...d, customTabs: (d.customTabs || []).map(t => t.id === tabId ? { ...t, [field]: value } : t) }));
  };

  const handleEditorSave = async () => {
    setEditorSaving(true);
    try {
      const payload = { ...editorForm, profileDesign: editorDesignState };
      if (payload.currentStatus?.text) payload.currentStatus.updatedAt = new Date().toISOString();
      const res = await fetch('/api/users/me', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setEditorSuccess('Saved!');
        setTimeout(() => setEditorSuccess(''), 2500);
        if (data.user?.username && data.user.username !== profile.username) {
          window.location.href = `/profile/${data.user.username}`;
        } else {
          window.location.reload();
        }
      } else {
        alert(data.error || 'Failed to save changes');
      }
    } catch (err) {
      alert('An error occurred while saving.');
    }
    setEditorSaving(false);
  };

  const toggleDesignTab = (tabName) => {
    setEditorDesignState(prev => ({ ...prev, tabs: { ...prev.tabs, [tabName]: !prev.tabs[tabName] } }));
  };

  return (
    <div className="flex relative" style={{ minHeight: '100%' }}>
      {/* Main Profile Content */}
      <div className="flex-1 transition-all duration-300" style={{ marginRight: editorOpen ? panelWidth : 0 }}>

    {/* Cover Image Banner */}
    {profile.coverImage && (
      <div className="relative w-full" style={{ height: template === 'minimal' ? 220 : 200 }}>
        <img src={profile.coverImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--color-bg-primary) 0%, transparent 40%)' }} />
      </div>
    )}

    <div className={`mx-auto px-6 ${profile.coverImage ? 'pt-0' : 'py-12'} ${template === 'minimal' ? 'max-w-2xl' : 'max-w-3xl'}`}
      style={profile.coverImage ? { marginTop: template === 'minimal' ? -60 : -50, position: 'relative', zIndex: 1 } : undefined}>
      {!profile.coverImage && <div style={{ paddingTop: 48 }} />}
      {/* Profile Header */}
      <div className={`flex flex-col gap-6 mb-8 ${template === 'minimal' ? 'items-center text-center' : 'sm:flex-row items-start'}`}>
        <div className={`w-20 h-20 rounded-full gradient-brand flex items-center justify-center text-2xl font-bold text-white shrink-0 ${template === 'minimal' ? 'w-24 h-24 text-3xl mb-2' : ''}`}
          style={profile.coverImage ? { border: '4px solid var(--color-bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : undefined}>

          {profile.avatar ? <img src={profile.avatar} className="w-full h-full rounded-full object-cover" /> : profile.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${template === 'minimal' ? 'justify-center' : ''}`} style={{ color: 'var(--color-text-primary)' }}>
            {profile.name}
            {profile.subscription?.plan === 'writer' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0" 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.15))', 
                  color: '#ea580c',
                  border: '1px solid rgba(234,88,12,0.2)'
                }}>
                ✨ Writer
              </span>
            )}
          </h1>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-tertiary)' }}>@{profile.username}</p>

          {/* Now Building Status */}
          {profile.currentStatus?.text && (
            <div className={`mb-3 ${template === 'minimal' ? 'flex justify-center' : ''}`}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                {renderStatusIcon(profile.currentStatus.emoji || '🔨', 12)}
                <span>{profile.currentStatus.text}</span>
              </span>
            </div>
          )}

          {profile.bio && <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{profile.bio}</p>}
          
          <div className={`flex items-center gap-6 mb-4 ${template === 'minimal' ? 'justify-center' : ''}`}>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}><strong style={{ color: 'var(--color-text-primary)' }}>{formatNumber(profile.followersCount)}</strong> followers</span>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}><strong style={{ color: 'var(--color-text-primary)' }}>{formatNumber(profile.followingCount)}</strong> following</span>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}><strong style={{ color: 'var(--color-text-primary)' }}>{formatNumber(profile.postsCount)}</strong> posts</span>
          </div>

          <div className={`flex gap-3 ${template === 'minimal' ? 'justify-center' : ''}`}>
            {!isOwn && currentUser && (
              <button onClick={handleFollow}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: isFollowing ? 'transparent' : 'var(--color-brand)',
                  color: isFollowing ? 'var(--color-text-primary)' : 'white',
                  border: `1px solid ${isFollowing ? 'var(--color-border-secondary)' : 'var(--color-brand)'}`,
                }}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            {isOwn && (
              <button onClick={() => setEditorOpen(true)} className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-[var(--color-bg-hover)]" style={{ border: '1px solid var(--color-border-secondary)', color: 'var(--color-text-primary)' }}>
                <Edit3 size={14} />
                Edit Site
              </button>
            )}
          </div>

          {/* Social Links — Icon Buttons */}
          {(liveDesign.tabs?.social !== false) && profile.socialLinks && Object.entries(profile.socialLinks).filter(([,v]) => v).length > 0 && (
            <div className={`flex gap-2 mt-4 flex-wrap ${template === 'minimal' ? 'justify-center' : ''}`}>
              {Object.entries(profile.socialLinks).filter(([,v]) => v).map(([key, url]) => {
                const resolved = resolveSocialIcon(key, url);
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    title={resolved.label}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-md"
                    style={{ background: `${resolved.color}12`, color: resolved.color, border: '1px solid var(--color-border-primary)' }}>
                    <resolved.Icon size={16} />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pinned / Featured Posts */}
      {pinnedPosts && pinnedPosts.length > 0 && (
        <div className="mb-12 animate-in fade-in duration-700">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 rounded-lg" style={{ background: 'var(--color-brand-glow)' }}>
              <Pin size={14} style={{ color: 'var(--color-brand)', transform: 'rotate(45deg)' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}>
              Featured Articles
            </span>
          </div>

          {pinnedPosts.length === 1 ? (
            /* 1 Pinned Post: Spectacular Compact Hero Card */
            <div className="relative group max-w-2xl mx-auto">
              <Link href={`/blog/${pinnedPosts[0].slug || pinnedPosts[0]._id}`}
                className="block rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-3px] hover:shadow-lg"
                style={{ 
                  background: 'var(--color-bg-card)', 
                  border: '1px solid var(--color-border-primary)',
                  boxShadow: '0 4px 20px -6px rgba(0, 0, 0, 0.05)'
                }}>
                <div className="flex flex-col sm:flex-row sm:h-52">
                  {pinnedPosts[0].coverImage ? (
                    <div className="sm:w-60 relative min-h-[160px] sm:min-h-full overflow-hidden shrink-0">
                      <img 
                        src={pinnedPosts[0].coverImage} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="sm:w-44 min-h-[120px] sm:min-h-full gradient-brand flex items-center justify-center relative p-6 shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
                      <Feather size={24} className="text-white/70 animate-pulse" />
                    </div>
                  )}
                  
                  <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                          ★ Featured
                        </span>
                        {pinnedPosts[0].category?.name && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            • {pinnedPosts[0].category.name}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-base sm:text-lg font-bold mb-1.5 group-hover:text-[var(--color-brand)] transition-colors leading-snug line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                        {pinnedPosts[0].title}
                      </h3>
                      
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {getPostExcerpt(pinnedPosts[0], 120)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t mt-3 sm:mt-0" style={{ borderColor: 'var(--color-border-primary)' }}>
                      <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{timeAgo(pinnedPosts[0].publishedAt || pinnedPosts[0].createdAt)}</span>
                        <span>{pinnedPosts[0].readTime || 1} min read</span>
                        <span className="flex items-center gap-1">
                          <Heart size={11} className="text-red-500/80 fill-current" /> {pinnedPosts[0].likesCount || 0}
                        </span>
                      </div>
                      <span className="text-xs font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all" style={{ color: 'var(--color-brand)' }}>
                        Read Article <span className="text-sm">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              {isOwn && (
                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      await fetch(`/api/posts/${pinnedPosts[0]._id}/pin`, { method: 'POST' });
                      window.location.reload();
                    } catch {}
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 shadow-md hover:scale-105"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}
                  title="Unpin post"
                >
                  <Pin size={12} style={{ color: 'var(--color-brand)' }} className="fill-current" />
                </button>
              )}
            </div>
          ) : pinnedPosts.length === 2 ? (
            /* 2 Pinned Posts: Elegant Two Column Grid */
            <div className="grid sm:grid-cols-2 gap-4">
              {pinnedPosts.map(post => (
                <div key={post._id} className="relative group">
                  <Link href={`/blog/${post.slug || post._id}`}
                    className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl h-full"
                    style={{ 
                      background: 'var(--color-bg-card)', 
                      border: '1px solid var(--color-border-primary)',
                      boxShadow: '0 6px 20px -5px rgba(0, 0, 0, 0.03)'
                    }}>
                    {post.coverImage ? (
                      <div className="h-44 overflow-hidden relative">
                        <img 
                          src={post.coverImage} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      </div>
                    ) : (
                      <div className="h-44 gradient-brand flex items-center justify-center relative shrink-0">
                        <div className="absolute inset-0 bg-black/10" />
                        <Feather size={28} className="text-white/80" />
                      </div>
                    )}
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                            style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                            ★ Featured
                          </span>
                          {post.category?.name && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                              • {post.category.name}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-base font-bold mb-2 group-hover:text-[var(--color-brand)] transition-colors line-clamp-2 leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                          {post.title}
                        </h3>
                        
                        <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {getPostExcerpt(post, 120)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t mt-auto" style={{ borderColor: 'var(--color-border-primary)' }}>
                        <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          <span>{post.readTime || 1} min read</span>
                          <span className="flex items-center gap-1"><Heart size={10} className="text-red-500/80 fill-current" /> {post.likesCount || 0}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
                          Read →
                        </span>
                      </div>
                    </div>
                  </Link>
                  {isOwn && (
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await fetch(`/api/posts/${post._id}/pin`, { method: 'POST' });
                          window.location.reload();
                        } catch {}
                      }}
                      className="absolute top-3 right-3 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10 shadow-md hover:scale-105"
                      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}
                      title="Unpin post"
                    >
                      <Pin size={13} style={{ color: 'var(--color-brand)' }} className="fill-current" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* 3+ Pinned Posts: Masterful Asymmetric Grid */
            <div className="space-y-4">
              {/* Main Hero Featured */}
              <div className="relative group">
                <Link href={`/blog/${pinnedPosts[0].slug || pinnedPosts[0]._id}`}
                  className="block rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl"
                  style={{ 
                    background: 'var(--color-bg-card)', 
                    border: '1px solid var(--color-border-primary)',
                    boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.04)'
                  }}>
                  <div className="flex flex-col md:flex-row min-h-[260px]">
                    {pinnedPosts[0].coverImage ? (
                      <div className="md:w-1/2 relative min-h-[200px] md:min-h-full overflow-hidden shrink-0">
                        <img 
                          src={pinnedPosts[0].coverImage} 
                          alt="" 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      </div>
                    ) : (
                      <div className="md:w-1/2 min-h-[180px] md:min-h-full gradient-brand flex items-center justify-center relative p-8 shrink-0">
                        <Feather size={36} className="text-white/70" />
                      </div>
                    )}
                    
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                            style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                            ★ Editor's Pick
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-[var(--color-brand)] transition-colors leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                          {pinnedPosts[0].title}
                        </h3>
                        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {getPostExcerpt(pinnedPosts[0], 140)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t mt-3" style={{ borderColor: 'var(--color-border-primary)' }}>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span>{pinnedPosts[0].readTime || 1} min read</span>
                          <span className="flex items-center gap-1"><Heart size={11} className="text-red-500/80 fill-current" /> {pinnedPosts[0].likesCount || 0}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
                          Read Article →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                {isOwn && (
                  <button 
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        await fetch(`/api/posts/${pinnedPosts[0]._id}/pin`, { method: 'POST' });
                        window.location.reload();
                      } catch {}
                    }}
                    className="absolute top-3 right-3 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10 shadow-md hover:scale-105"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}
                    title="Unpin post"
                  >
                    <Pin size={13} style={{ color: 'var(--color-brand)' }} className="fill-current" />
                  </button>
                )}
              </div>

              {/* Sub-featured grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {pinnedPosts.slice(1).map(post => (
                  <div key={post._id} className="relative group">
                    <Link href={`/blog/${post.slug || post._id}`}
                      className="flex gap-4 p-4 rounded-xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg h-full"
                      style={{ 
                        background: 'var(--color-bg-card)', 
                        border: '1px solid var(--color-border-primary)'
                      }}>
                      {post.coverImage && (
                        <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 relative">
                          <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold line-clamp-2 group-hover:text-[var(--color-brand)] transition-colors leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                            {post.title}
                          </h4>
                          <p className="text-[11px] leading-relaxed line-clamp-1 mt-1 text-[var(--color-text-secondary)]">
                            {getPostExcerpt(post, 60)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          <span>{post.readTime || 1} min read</span>
                          <span className="flex items-center gap-1"><Heart size={9} className="text-red-500/80 fill-current" /> {post.likesCount || 0}</span>
                        </div>
                      </div>
                    </Link>
                    {isOwn && (
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            await fetch(`/api/posts/${post._id}/pin`, { method: 'POST' });
                            window.location.reload();
                          } catch {}
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm hover:scale-105"
                        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}
                        title="Unpin post"
                      >
                        <Pin size={11} style={{ color: 'var(--color-brand)' }} className="fill-current" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {(() => {
        const ordered = getOrderedTabsList();
        
        const isVisible = (id) => {
          if (id === 'articles') return showArticles;
          if (id === 'social') return showSocial;
          if (id === 'contact') return showContact;
          const ct = customTabs.find(t => t.id === id);
          return ct ? (ct.visible !== false) : false;
        };
        
        const visibleTabs = ordered.filter(isVisible);
        
        if (visibleTabs.length === 0) return null;
        
        return (
          <div className={`flex items-center gap-8 mb-6 border-b overflow-x-auto whitespace-nowrap hide-scrollbar ${template === 'minimal' ? 'justify-center' : ''}`} style={{ borderColor: 'var(--color-border-primary)' }}>
            {visibleTabs.map(id => {
              let label = '';
              if (id === 'articles') label = 'Articles';
              else if (id === 'social') label = 'Social';
              else if (id === 'contact') label = 'Contact';
              else {
                const ct = customTabs.find(t => t.id === id);
                label = ct?.label || id;
              }
              
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === id ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]' : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Tab Content */}
      {activeTab === 'articles' && showArticles && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-4">
            {posts.filter(p => !p.isPinned).map(post => (
              <div key={post._id}
                className="p-5 rounded-xl transition-all hover:translate-y-[-1px] group"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/blog/${post.slug || post._id}`} className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold mb-1 hover:text-[var(--color-brand)]" style={{ color: 'var(--color-text-primary)' }}>
                      {post.isPinned && <Pin size={13} className="inline mr-1.5 -mt-0.5" style={{ color: 'var(--color-brand)' }} />}
                      {post.title}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                        {getPostExcerpt(post, 150)}
                      </p>
                  </Link>
                  {post.coverImage && (
                    <img src={post.coverImage} alt="" className="w-[100px] h-[66px] rounded-lg object-cover shrink-0 hidden sm:block" />
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{timeAgo(post.publishedAt || post.createdAt)}</span>
                    <span>{post.readTime || Math.ceil((post.content?.length || 0) / 1000)} min</span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {post.likesCount || 0}
                    </span>
                  </div>
                  {isOwn && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={async () => {
                          try {
                            await fetch(`/api/posts/${post._id}/pin`, { method: 'POST' });
                            window.location.reload();
                          } catch {}
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[var(--color-bg-hover)]"
                        style={{ color: post.isPinned ? 'var(--color-brand)' : 'var(--color-text-secondary)' }}>
                        <Pin size={13} /> {post.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <Link href={`/dashboard/posts/${post._id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[var(--color-bg-hover)]"
                        style={{ color: 'var(--color-text-secondary)' }}>
                        <Edit3 size={13} /> Edit
                      </Link>
                      <button onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(post._id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-red-50"
                        style={{ color: '#ef4444' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {posts.filter(p => !p.isPinned).length === 0 && (
              <div className="text-center py-12 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border-primary)' }}>
                <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No other posts to show.</p>
              </div>
            )}
          </div>
        </div>
      )}



      {activeTab === 'social' && showSocial && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-lg mx-auto">
            {/* Header card */}
            <div className="p-6 rounded-2xl text-center border mb-6" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-brand-glow)' }}>
                <Share2 size={20} style={{ color: 'var(--color-brand)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Social Profiles</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Connect with me on other social networks and professional platforms.
              </p>
            </div>

            {/* Social Links List */}
            {profile.socialLinks && Object.entries(profile.socialLinks).filter(([,v]) => v).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(profile.socialLinks).filter(([,v]) => v).map(([key, url]) => {
                  const resolved = resolveSocialIcon(key, url);
                  return (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:translate-y-[-1px] hover:shadow-md group"
                      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                          style={{ background: `${resolved.color}12`, color: resolved.color }}>
                          <resolved.Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-bold truncate group-hover:text-[var(--color-brand)] transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                            {resolved.label}
                          </h4>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            {url}
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-all text-gray-400 mr-1" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
                <Share2 size={32} className="mx-auto opacity-20 mb-3" />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No social profiles linked yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contact' && showContact && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-lg mx-auto">
            {/* Header card */}
            <div className="p-6 rounded-2xl text-center border mb-6" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-brand-glow)' }}>
                <MessageCircle size={20} style={{ color: 'var(--color-brand)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Get in Touch</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {profile.contactDetails?.message || "Feel free to reach out. I'm always open to discussing new projects, creative ideas or opportunities to be part of your visions."}
              </p>
            </div>

            {/* Contact Form */}
            {contactSent ? (
              <div className="p-8 rounded-2xl text-center border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
                <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
                  <CheckCircle size={24} style={{ color: '#22c55e' }} />
                </div>
                <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Message Sent!</h4>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Your message has been delivered to {profile.name}. They&apos;ll see it in their inbox.
                </p>
                <button
                  onClick={() => { setContactSent(false); setContactForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ color: 'var(--color-brand)', background: 'var(--color-brand-glow)' }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-primary)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Your Name *</label>
                    <input
                      type="text" required maxLength={100}
                      value={contactForm.name}
                      onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Your Email *</label>
                    <input
                      type="email" required maxLength={200}
                      value={contactForm.email}
                      onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Subject</label>
                  <input
                    type="text" maxLength={200}
                    value={contactForm.subject}
                    onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="What's this about?"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Message *</label>
                  <textarea
                    required maxLength={5000} rows={5}
                    value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Write your message here..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {contactForm.message.length} / 5000
                    </span>
                  </div>
                </div>

                {contactError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                    <AlertCircle size={14} />
                    {contactError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={contactSending}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--color-brand)' }}>
                  {contactSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {contactSending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Custom Tab Content */}
      {customTabs.map(ct => {
        if (activeTab !== ct.id) return null;
        // Get posts assigned to this tab
        const tabPostIds = ct.posts || [];
        const tabPosts = posts.filter(p => tabPostIds.includes(p._id) && !p.isPinned);
        // Non-owners only see published posts
        const visiblePosts = isOwn ? tabPosts : tabPosts.filter(p => p.status === 'published');

        return (
          <div key={ct.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Optional description */}
            {ct.content && (
              <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{ct.content}</p>
              </div>
            )}

            {/* Posts grid */}
            {visiblePosts.length > 0 ? (
              <div className="space-y-3">
                {visiblePosts.map(post => (
                  <Link key={post._id} href={`/blog/${post.slug || post._id}`}
                    className="group block p-4 rounded-xl transition-all hover:translate-y-[-2px] hover:shadow-lg"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                    <div className="flex gap-4">
                      {post.coverImage && (
                        <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0">
                          <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold truncate group-hover:opacity-80 transition-opacity" style={{ color: 'var(--color-text-primary)' }}>{post.title}</h3>
                          {post.status === 'draft' && isOwn && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                              style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'rgb(245, 158, 11)' }}>Draft</span>
                          )}
                        </div>
                        <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--color-text-tertiary)' }}>{getPostExcerpt(post, 120)}</p>
                        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {post.category?.name && <span>{post.category.name}</span>}
                          {post.readTime && <span>{post.readTime} min read</span>}
                          {post.likesCount > 0 && <span className="flex items-center gap-0.5"><Heart size={9} /> {post.likesCount}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              !ct.content && (
                <div className="text-center py-12 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border-primary)' }}>
                  <FileText size={20} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No posts in {ct.label} yet.</p>
                  {isOwn && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Click "Edit Site" → Design → edit this tab to add posts.</p>}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
      </div>

      {/* ── Editor Sidebar Panel ── */}
      {isOwn && editorOpen && (
        <div className="fixed top-0 right-0 h-full z-50 flex" style={{ width: panelWidth }}>
          {/* Resize Handle */}
          <div onMouseDown={handleResizeStart}
            className="w-1.5 h-full cursor-col-resize flex items-center justify-center group hover:bg-[var(--color-brand)] transition-colors"
            style={{ background: 'var(--color-border-primary)' }}>
            <div className="w-1 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'white' }} />
          </div>

          {/* Panel Content */}
          <div className="flex-1 h-full overflow-y-auto" style={{ background: 'var(--color-bg-primary)', borderLeft: '1px solid var(--color-border-primary)' }}>
            {/* Panel Header */}
            <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: 'var(--color-bg-primary)', borderBottom: '1px solid var(--color-border-primary)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit Site</h2>
              <div className="flex items-center gap-2">
                {editorSuccess && (
                  <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#22c55e' }}>
                    <Check size={12} /> {editorSuccess}
                  </span>
                )}
                <button onClick={handleEditorSave} disabled={editorSaving}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: 'var(--color-brand)' }}>
                  {editorSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save
                </button>
                <button onClick={() => setEditorOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--color-bg-hover)]"
                  style={{ color: 'var(--color-text-tertiary)' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Editor Tabs */}
            <div className="px-5 pt-3 pb-1 flex gap-1 overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
              {[
                { key: 'profile', label: 'Profile' },
                { key: 'design', label: 'Design Settings' },
                { key: 'social', label: 'Social' },
                { key: 'contact', label: 'Contact' },
              ].map(t => (
                <button key={t.key} onClick={() => setEditorTab(t.key)}
                  className="px-3 py-2 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap"
                  style={{
                    color: editorTab === t.key ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                    background: editorTab === t.key ? 'var(--color-brand-glow)' : 'transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Editor Tab Content */}
            <div className="px-5 py-5 space-y-5">

              {/* ── PROFILE TAB ── */}
              {editorTab === 'profile' && (
                <>
                  {/* Avatar & Cover Upload */}
                  <div>
                    <label className="block text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold text-white shrink-0"
                          style={{ background: profile.avatar ? 'transparent' : 'var(--color-brand)' }}>
                          {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" /> : profile.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {uploadingAvatar ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} className="text-white" />}
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => handleImageUpload(e.target.files?.[0], 'avatar')} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {confirmRemoveAvatar ? (
                            <>
                              <button onClick={() => handleRemoveImage('avatar')}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-white bg-red-600 hover:bg-red-700 cursor-pointer">
                                Confirm Remove?
                              </button>
                              <button onClick={() => setConfirmRemoveAvatar(false)}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-[var(--color-bg-hover)] cursor-pointer"
                                style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => avatarInputRef.current?.click()}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-90 cursor-pointer"
                                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}>
                                {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                              </button>
                              {profile.avatar && (
                                <button onClick={() => setConfirmRemoveAvatar(true)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/10 cursor-pointer"
                                  style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
                                  Remove
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>JPG, PNG, or WebP. Max 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Cover Image</label>
                      {profile.coverImage && (
                        <div className="flex items-center gap-2">
                          {confirmRemoveCover ? (
                            <>
                              <button onClick={() => handleRemoveImage('coverImage')}
                                className="text-[10px] font-semibold text-red-500 hover:underline cursor-pointer">
                                Confirm Cover Removal?
                              </button>
                              <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>|</span>
                              <button onClick={() => setConfirmRemoveCover(false)}
                                className="text-[10px] font-semibold text-[var(--color-text-muted)] hover:underline cursor-pointer">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmRemoveCover(true)}
                              className="text-[10px] font-semibold text-red-500 hover:underline cursor-pointer">
                              Remove Cover
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="relative group cursor-pointer rounded-xl overflow-hidden" onClick={() => coverInputRef.current?.click()}
                      style={{ height: 100, background: profile.coverImage ? `url(${profile.coverImage}) center/cover` : 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)' }}>
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploadingCover ? <Loader2 size={18} className="animate-spin text-white" /> : (
                          <>
                            <ImageIcon size={18} className="text-white mb-1" />
                            <span className="text-[10px] text-white font-medium">Change Cover</span>
                          </>
                        )}
                      </div>
                      {!profile.coverImage && !uploadingCover && (
                        <div className="flex flex-col items-center justify-center h-full">
                          <Upload size={16} style={{ color: 'var(--color-text-muted)' }} />
                          <span className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Add a cover image</span>
                        </div>
                      )}
                    </div>
                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleImageUpload(e.target.files?.[0], 'coverImage')} />
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border-primary)', paddingTop: 16 }}>
                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Name</label>
                    <input value={editorForm.name} onChange={e => setEditorForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                      style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-[var(--color-text-muted)]">@</span>
                      <input value={editorForm.username} onChange={e => setEditorForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                        className="w-full pl-7 pr-3 py-2 rounded-lg text-sm focus:outline-none"
                        style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                        placeholder="username"
                        maxLength={30}
                      />
                    </div>
                    <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      Changing your username will update your profile URL.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Short Bio</label>
                    <textarea value={editorForm.bio} onChange={e => setEditorForm(f => ({ ...f, bio: e.target.value }))}
                      className="w-full h-16 px-3 py-2 rounded-lg text-sm resize-none focus:outline-none"
                      style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                      maxLength={160} placeholder="A short 1-2 sentence tagline..." />
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{editorForm.bio.length}/160</span>
                  </div>

                  {/* Now Building */}
                  <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket size={14} style={{ color: 'var(--color-brand)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Now Building</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.keys(STATUS_ICONS).map(key => {
                        const IconComponent = STATUS_ICONS[key].icon;
                        const isSelected = editorForm.currentStatus?.emoji === key || editorForm.currentStatus?.emoji === STATUS_ICONS[key].emoji;
                        return (
                          <button key={key} onClick={() => setEditorForm(f => ({ ...f, currentStatus: { ...f.currentStatus, emoji: key } }))}
                            type="button"
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                            style={{
                              background: isSelected ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)',
                              border: `1.5px solid ${isSelected ? 'var(--color-brand)' : 'transparent'}`,
                            }}>
                            <IconComponent size={15} style={{ color: isSelected ? 'var(--color-brand)' : STATUS_ICONS[key].color }} />
                          </button>
                        );
                      })}
                    </div>
                    <input value={editorForm.currentStatus?.text || ''} onChange={e => setEditorForm(f => ({ ...f, currentStatus: { ...f.currentStatus, text: e.target.value } }))}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                      style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                      placeholder="Building a CLI tool..." maxLength={100} />
                  </div>
                </>
              )}

              {/* ── DESIGN TAB ── */}
              {editorTab === 'design' && (
                <>
                  {/* Template Picker */}
                  <div>
                    <label className="block text-[11px] font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Template</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'default', label: 'Default', desc: 'Left-aligned layout', icon: LayoutTemplate },
                        { key: 'minimal', label: 'Minimal', desc: 'Centered, focused', icon: SquareUser },
                      ].map(t => (
                        <button key={t.key} onClick={() => setEditorDesignState(d => ({ ...d, template: t.key }))}
                          className="p-3 rounded-xl text-left transition-all"
                          style={{
                            border: `2px solid ${editorDesignState.template === t.key ? 'var(--color-brand)' : 'var(--color-border-primary)'}`,
                            background: editorDesignState.template === t.key ? 'var(--color-brand-glow)' : 'var(--color-bg-card)',
                          }}>
                          <t.icon size={18} style={{ color: editorDesignState.template === t.key ? 'var(--color-brand)' : 'var(--color-text-tertiary)', marginBottom: 6 }} />
                          <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t.label}</div>
                          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sections & Tabs Layout */}
                  <div className="mt-6">
                    <label className="block text-[11px] font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Sections & Tabs Layout</label>
                    <div className="space-y-2 mb-3">
                      {getOrderedTabsList().map((id, index) => {
                        const isBuiltIn = id === 'articles' || id === 'social' || id === 'contact';
                        const customTab = !isBuiltIn && (editorDesignState.customTabs || []).find(t => t.id === id);
                        
                        let label = '';
                        let hint = '';
                        let isVisible = false;
                        
                        if (id === 'articles') {
                          label = 'Articles';
                          hint = 'All your published blog posts will automatically appear here.';
                          isVisible = editorDesignState.tabs?.articles ?? true;
                        } else if (id === 'social') {
                          label = 'Social';
                          hint = 'Show social profiles and links in a dedicated section.';
                          isVisible = editorDesignState.tabs?.social ?? true;
                        } else if (id === 'contact') {
                          label = 'Contact';
                          hint = 'Allow visitors to send messages and get in touch.';
                          isVisible = editorDesignState.tabs?.contact ?? true;
                        } else if (customTab) {
                          label = customTab.label;
                          isVisible = customTab.visible !== false;
                        } else {
                          return null; // Safety check
                        }
                        
                        const handleToggleVisible = () => {
                          if (isBuiltIn) {
                            toggleDesignTab(id);
                          } else {
                            updateCustomTab(id, 'visible', !isVisible);
                          }
                        };
                        
                        const handleRemove = () => {
                          if (!isBuiltIn) {
                            removeCustomTab(id);
                          }
                        };

                        const tabsList = getOrderedTabsList();

                        return (
                          <div key={id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-card)' }}>
                            <div className="flex items-center justify-between p-3 gap-2">
                              {/* Reordering Up/Down controls */}
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => moveTab(index, -1)}
                                  className="w-5 h-5 rounded hover:bg-[var(--color-bg-hover)] flex items-center justify-center disabled:opacity-30 transition-all cursor-pointer"
                                  style={{ color: 'var(--color-text-muted)' }}
                                >
                                  <ChevronUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === tabsList.length - 1}
                                  onClick={() => moveTab(index, 1)}
                                  className="w-5 h-5 rounded hover:bg-[var(--color-bg-hover)] flex items-center justify-center disabled:opacity-30 transition-all cursor-pointer"
                                  style={{ color: 'var(--color-text-muted)' }}
                                >
                                  <ChevronDown size={12} />
                                </button>
                              </div>

                              {/* Label & Details */}
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" 
                                    style={{ 
                                      background: isBuiltIn ? 'var(--color-bg-tertiary)' : 'var(--color-brand-glow)', 
                                      color: isBuiltIn ? 'var(--color-text-secondary)' : 'var(--color-brand)' 
                                    }}>
                                    {isBuiltIn ? 'Built-in' : 'Custom'}
                                  </span>
                                </div>
                                {hint && <p className="text-[9px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
                              </div>

                              {/* Action controls */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!isBuiltIn && (
                                  <button onClick={() => setEditingTabId(editingTabId === id ? null : id)}
                                    type="button"
                                    className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-[var(--color-bg-hover)]"
                                    style={{ color: editingTabId === id ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                                    <Edit3 size={12} />
                                  </button>
                                )}
                                
                                <button onClick={handleToggleVisible}
                                  type="button"
                                  className="w-8 h-5 rounded-full relative transition-all shrink-0"
                                  style={{ 
                                    background: isVisible ? 'var(--color-brand)' : 'var(--color-bg-tertiary)', 
                                    border: `1px solid ${isVisible ? 'var(--color-brand)' : 'var(--color-border-secondary)'}` 
                                  }}>
                                  <div className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all"
                                    style={{ left: isVisible ? 'calc(100% - 18px)' : '2px' }} />
                                </button>

                                {!isBuiltIn && (
                                  <button onClick={handleRemove}
                                    type="button"
                                    className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-red-500/10"
                                    style={{ color: '#ef4444' }}>
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Expanded editor for Custom Tabs */}
                            {!isBuiltIn && customTab && editingTabId === id && (
                              <div className="px-3 pb-3 space-y-3" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
                                <div className="pt-2">
                                  <label className="block text-[10px] font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Tab Name</label>
                                  <input value={customTab.label} onChange={e => updateCustomTab(id, 'label', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-md text-xs focus:outline-none"
                                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                                    maxLength={30} />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Description (Optional)</label>
                                  <textarea value={customTab.content || ''} onChange={e => updateCustomTab(id, 'content', e.target.value)}
                                    className="w-full h-16 px-2.5 py-1.5 rounded-md text-xs resize-none focus:outline-none"
                                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                                    maxLength={500}
                                    placeholder="Optional short description for this section..." />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                                    Assign Posts ({(customTab.posts || []).length} selected)
                                  </label>
                                  <div className="max-h-48 overflow-y-auto rounded-lg space-y-1" style={{ border: '1px solid var(--color-border-primary)', padding: 6 }}>
                                    {posts.length > 0 ? posts.map(post => {
                                      const isAssigned = (customTab.posts || []).includes(post._id);
                                      return (
                                        <button key={post._id} onClick={() => togglePostInTab(id, post._id)}
                                          type="button"
                                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all hover:opacity-80"
                                          style={{ background: isAssigned ? 'var(--color-brand-glow)' : 'transparent', border: `1px solid ${isAssigned ? 'var(--color-brand)' : 'transparent'}` }}>
                                          <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
                                            style={{ borderColor: isAssigned ? 'var(--color-brand)' : 'var(--color-border-secondary)', background: isAssigned ? 'var(--color-brand)' : 'transparent' }}>
                                            {isAssigned && <Check size={10} className="text-white" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{post.title}</p>
                                            <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                                              {post.category?.name || 'Uncategorized'}
                                            </p>
                                          </div>
                                          {post.status === 'draft' && (
                                            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                                              style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'rgb(245, 158, 11)' }}>Draft</span>
                                          )}
                                        </button>
                                      );
                                    }) : (
                                      <div className="text-center py-4">
                                        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>No posts yet. Create a blog post first!</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add new custom tab */}
                    <div className="flex gap-2">
                      <input value={newTabName} onChange={e => setNewTabName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTab(); } }}
                        className="flex-1 px-2.5 py-2 rounded-lg text-xs focus:outline-none"
                        style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                        placeholder="New section name..." maxLength={30} />
                      <button onClick={addCustomTab}
                        type="button"
                        className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 flex items-center gap-1"
                        style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)', border: '1px solid var(--color-brand)' }}>
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      Create custom sections to showcase anything — skills, services, testimonials, FAQ, etc.
                    </p>
                  </div>
                </>
              )}



              {/* ── CONTACT TAB ── */}
              {editorTab === 'contact' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Public Email</label>
                    <input value={editorForm.contactDetails?.publicEmail || ''} onChange={e => setEditorForm(f => ({ ...f, contactDetails: { ...f.contactDetails, publicEmail: e.target.value } }))}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                      style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                      placeholder="hello@example.com" type="email" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Contact Message</label>
                    <textarea value={editorForm.contactDetails?.message || ''} onChange={e => setEditorForm(f => ({ ...f, contactDetails: { ...f.contactDetails, message: e.target.value } }))}
                      className="w-full h-24 px-3 py-2 rounded-lg text-sm resize-none focus:outline-none"
                      style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                      maxLength={500} placeholder="A short message for people who want to reach out..." />
                  </div>

                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    This information appears on your Contact tab. Visitors can also send you messages via the contact form.
                  </p>
                </>
              )}

              {/* ── SOCIAL TAB ── */}
              {editorTab === 'social' && (
                <>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    Add your social profiles. These appear as icon buttons on your profile header.
                  </p>
                  <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Social Links</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
                        {Object.keys(editorForm.socialLinks || {}).filter(k => editorForm.socialLinks[k] !== undefined).length} / 15
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Object.keys(editorForm.socialLinks || {}).filter(key => editorForm.socialLinks[key] !== undefined).map(key => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.key === key);
                        const resolved = resolveSocialIcon(key, editorForm.socialLinks[key]);
                        return (
                          <div key={key} className="flex items-center gap-2 group">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${resolved.color}10`, color: resolved.color }}>
                              <resolved.Icon size={14} />
                            </div>
                            <div className="flex-1 flex gap-2 min-w-0">
                              {!platform ? (
                                <div className="flex-1 flex gap-2 items-center min-w-0">
                                  <span className="text-[11px] font-bold shrink-0 truncate max-w-[80px]" title={key}>{key}:</span>
                                  <input
                                    value={editorForm.socialLinks[key] || ''}
                                    onChange={e => setEditorForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }))}
                                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none min-w-0"
                                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                                    placeholder="https://..."
                                  />
                                </div>
                              ) : (
                                <input
                                  value={editorForm.socialLinks[key] || ''}
                                  onChange={e => setEditorForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }))}
                                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none min-w-0"
                                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                                  placeholder={platform.placeholder}
                                />
                              )}
                            </div>
                            <button onClick={() => setEditorForm(f => { const sl = { ...f.socialLinks }; delete sl[key]; return { ...f, socialLinks: sl }; })}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              style={{ color: '#ef4444' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {Object.keys(editorForm.socialLinks || {}).filter(k => editorForm.socialLinks[k] !== undefined).length < 15 && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={customUrl}
                            onChange={e => setCustomUrl(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomLink(); } }}
                            placeholder="Paste link (e.g. github.com/username)"
                            className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none min-w-0"
                            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomLink}
                            className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 flex items-center gap-1 cursor-pointer shrink-0"
                            style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)', border: '1px solid var(--color-brand)' }}
                          >
                            <Plus size={12} /> Add
                          </button>
                        </div>
                        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                          Paste any link (X/Twitter, GitHub, LinkedIn, Patreon, website, etc.), and the system automatically detects the icon and label.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>

            {/* Bottom Save Bar */}
            <div className="sticky bottom-0 px-5 py-3 flex items-center justify-between" style={{ background: 'var(--color-bg-primary)', borderTop: '1px solid var(--color-border-primary)' }}>
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Drag the left edge to resize</span>
              <button onClick={handleEditorSave} disabled={editorSaving}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                style={{ background: 'var(--color-brand)' }}>
                {editorSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay when editor is open on mobile */}
      {editorOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setEditorOpen(false)} />
      )}

      {/* Custom Dialog Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
            <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
              Delete Post
            </h3>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--color-bg-hover)] cursor-pointer"
                style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const idToDelete = deleteConfirmId;
                  setDeleteConfirmId(null);
                  try {
                    await fetch(`/api/posts/${idToDelete}`, { method: 'DELETE' });
                    window.location.reload();
                  } catch {}
                }}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${params.username}`).then(r => r.json()).then(data => {
      setProfile(data.user); 
      const allPosts = data.posts || [];
      // Separate pinned posts
      const pinned = allPosts.filter(p => p.isPinned);
      setPinnedPosts(pinned);
      setPosts(allPosts);
      setIsFollowing(data.isFollowing); 
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.username]);

  const handleFollow = async () => {
    if (!currentUser) return;
    const res = await fetch(`/api/users/${params.username}/follow`, { method: 'POST' });
    const data = await res.json();
    setIsFollowing(data.following);
    setProfile(p => ({ ...p, followersCount: p.followersCount + (data.following ? 1 : -1) }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand)' }} /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}><p style={{ color: 'var(--color-text-secondary)' }}>User not found</p></div>;

  const isOwn = currentUser?.username === profile.username;

  const content = (
    <ProfileContent
      profile={profile} posts={posts} pinnedPosts={pinnedPosts} isOwn={isOwn}
      currentUser={currentUser} isFollowing={isFollowing} handleFollow={handleFollow}
    />
  );

  // Logged in → show with dashboard shell
  if (currentUser) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  // Public → minimal nav
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <nav className="sticky top-0 z-50 glass-strong" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/explore" className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}><ArrowLeft size={16} /> Back</Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-brand flex items-center justify-center"><Feather size={12} className="text-white" /></div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>Sign in</Link>
          </div>
        </div>
      </nav>
      {content}
    </div>
  );
}
