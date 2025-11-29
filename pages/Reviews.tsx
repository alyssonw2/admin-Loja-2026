import React, { useState } from 'react';
import type { Review, Toast } from '../types';
import ReviewModal from '../components/ReviewModal';
import { PencilIcon, TrashIcon, StarIcon } from '../components/icons/Icons';

interface ReviewsProps {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id'>) => void;
  updateReview: (review: Review) => void;
  deleteReview: (reviewId: string) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <StarIcon key={i} className="w-5 h-5 text-yellow-400" filled={i < rating} />
    ))}
  </div>
);

const Reviews: React.FC<ReviewsProps> = ({ reviews, addReview, updateReview, deleteReview, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const handleOpenModal = (review: Review | null = null) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingReview(null);
    setIsModalOpen(false);
  };

  const handleSaveReview = (reviewData: Review | Omit<Review, 'id'>) => {
    if ('id' in reviewData) {
      updateReview(reviewData as Review);
    } else {
      addReview(reviewData);
    }
  };

  const handleDeleteReview = (review: Review) => {
    if (window.confirm(`Tem certeza que deseja excluir a avaliação de "${review.customerName}"?`)) {
      deleteReview(review.id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Gerenciar Avaliações</h2>
        <button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
          Adicionar Avaliação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <img src={review.customerPhotoUrl} alt={review.customerName} className="w-12 h-12 rounded-full mr-4 bg-gray-700" />
                <div>
                  <h3 className="font-bold text-white">{review.customerName}</h3>
                  <StarRating rating={review.rating} />
                </div>
              </div>
              <p className="text-gray-300 italic">"{review.comment}"</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('pt-BR')}</span>
              <div className="space-x-2">
                <button onClick={() => handleOpenModal(review)} className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-gray-700"><PencilIcon className="w-5 h-5"/></button>
                <button onClick={() => handleDeleteReview(review)} className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-gray-700"><TrashIcon className="w-5 h-5"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReviewModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveReview}
        review={editingReview}
        showToast={showToast}
      />
    </div>
  );
};

export default Reviews;