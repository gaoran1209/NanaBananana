import React from 'react';
import { type GeneratedImage } from '../types';
import { ImageCard } from './ImageCard';

interface ImageFeedProps {
  images: GeneratedImage[];
  onEditImage: (imageId: string, prompt: string) => Promise<void>;
}

export const ImageFeed: React.FC<ImageFeedProps> = ({ images, onEditImage }) => {
  if (images.length === 0) {
    return (
      <div className="mt-16 text-center text-gray-500">
        <p className="text-base">Your creations will appear here.</p>
      </div>
    );
  }

  return (
    <div className="mt-12 grid gap-6 md:gap-8 max-w-3xl mx-auto">
      {images.map((image) => (
        <ImageCard key={image.id} image={image} onEditImage={onEditImage} />
      ))}
    </div>
  );
};