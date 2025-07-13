
import React, { useState } from 'react';

interface StartScreenProps {
  onStart: (youtubeUrl: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    setIsValidUrl(YOUTUBE_URL_REGEX.test(url) || url === '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl.trim() && YOUTUBE_URL_REGEX.test(youtubeUrl)) {
      onStart(youtubeUrl);
    } else {
      setIsValidUrl(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <h2 className="text-2xl font-bold text-on-surface mb-2">Learn from Video</h2>
      <p className="text-on-surface-variant mb-8 max-w-lg text-center">
        Paste a YouTube video link below. Our AI will analyze its content and generate an adaptive test to help you master the material.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="youtubeUrl" className="block text-sm font-medium text-on-surface-variant mb-1">
            YouTube Video URL
          </label>
          <input
            type="text"
            id="youtubeUrl"
            value={youtubeUrl}
            onChange={handleUrlChange}
            className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-primary focus:border-primary transition ${
              !isValidUrl && youtubeUrl ? 'border-red-500 ring-red-500' : 'border-gray-300'
            }`}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {!isValidUrl && youtubeUrl && (
              <p className="mt-2 text-sm text-red-600">Please enter a valid YouTube URL.</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!youtubeUrl.trim() || !isValidUrl}
          className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          Generate Assessment
        </button>
      </form>
    </div>
  );
};