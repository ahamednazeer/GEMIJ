import React, { useState } from 'react';
import { Share2, Copy, Mail, MessageCircle, ExternalLink } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url: string;
  description?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ title, url, description, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title,
    text: description || title,
    url: window.location.origin + url
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(shareData.title);
    const body = encodeURIComponent(`${shareData.text}\n\n${shareData.url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`${shareData.title} ${shareData.url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(shareData.url);
    const title = encodeURIComponent(shareData.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(shareData.url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className={`inline-flex items-center px-4 py-2 border border-secondary-300 text-secondary-700 rounded-md hover:bg-secondary-50 transition-colors ${className}`}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </button>

      {isOpen && !navigator.share && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-secondary-200 z-10">
          <div className="py-1">
            <button
              onClick={copyToClipboard}
              className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={shareViaEmail}
              className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </button>
            <button
              onClick={shareViaTwitter}
              className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Twitter
            </button>
            <button
              onClick={shareViaLinkedIn}
              className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              LinkedIn
            </button>
            <button
              onClick={shareViaFacebook}
              className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Facebook
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ShareButton;