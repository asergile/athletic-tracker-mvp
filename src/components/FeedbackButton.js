import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { dbHelpers } from '../lib/supabase';

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Debug logging for production
      console.log('Environment check:', {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        dbHelpers: typeof dbHelpers,
        submitFeedback: typeof dbHelpers?.submitFeedback
      });
      
      console.log('Submitting feedback:', { message: message.trim() });
      
      if (!dbHelpers || typeof dbHelpers.submitFeedback !== 'function') {
        throw new Error(`dbHelpers not properly initialized: ${typeof dbHelpers}`);
      }
      
      const { data, error: submitError } = await dbHelpers.submitFeedback({
        message: message.trim(),
        page_context: window.location.pathname,
        user_agent: navigator.userAgent
      });

      console.log('Feedback result:', { data, error: submitError });

      if (submitError) {
        console.error('Feedback submission error:', submitError);
        setError(`Failed to send feedback: ${submitError.message || 'Unknown error'}`);
        return;
      }

      setMessage('');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
      }, 2000);

    } catch (err) {
      console.error('Feedback catch error:', err);
      setError(`Failed to send feedback: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span>Thanks for your feedback!</span>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        title="Send Feedback"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 max-w-[calc(100vw-3rem)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Quick Feedback</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's working? What's broken? Any suggestions?"
            className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            autoFocus
          />
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackButton;
