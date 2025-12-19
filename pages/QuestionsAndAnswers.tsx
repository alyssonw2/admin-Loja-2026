
import React, { useState } from 'react';
import type { QuestionAndAnswer, Product, Customer, Toast } from '../types';
import { ChatIcon, TrashIcon, CheckCircleIcon, ProductIcon } from '../components/icons/Icons';

interface QuestionsAndAnswersProps {
  questions: QuestionAndAnswer[];
  products: Product[];
  customers: Customer[];
  onUpdate: (q: QuestionAndAnswer) => void;
  onDelete: (id: string) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const QuestionsAndAnswers: React.FC<QuestionsAndAnswersProps> = ({ questions, products, customers, onUpdate, onDelete, showToast }) => {
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getCustomer = (id: string) => customers.find(c => c.id === id);

  const handleSendAnswer = (q: QuestionAndAnswer) => {
      if (!answerText.trim()) {
          showToast('Digite uma resposta.', 'error');
          return;
      }
      onUpdate({ ...q, answer_text: answerText });
      setAnsweringId(null);
      setAnswerText('');
  };

  const sortedQuestions = [...questions].sort((a, b) => b.question_date_integer - a.question_date_integer);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-indigo-50">Mensagens e Dúvidas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Perguntas enviadas por clientes através das páginas de produtos.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg border border-primary/20 text-sm font-bold">
            {questions.length} Mensagens Recebidas
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedQuestions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
             <ChatIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
             <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma pergunta encontrada no momento.</p>
          </div>
        ) : (
          sortedQuestions.map((q) => {
            const product = getProduct(q.product_id);
            const customer = getCustomer(q.customer_id);
            const date = new Date(q.question_date_integer).toLocaleString('pt-BR');
            const hasAnswer = !!q.answer_text;

            return (
              <div key={q.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600">
                          {customer?.avatarUrl ? (
                              <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full object-cover" />
                          ) : (
                              <ChatIcon className="text-primary w-6 h-6" />
                          )}
                       </div>
                       <div>
                          <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest mb-1">{date}</p>
                          <p className="text-sm font-bold text-primary mb-1">
                              {customer ? customer.name : 'Cliente Visitante'}
                          </p>
                          <p className="text-gray-900 dark:text-indigo-50 font-medium leading-relaxed">{q.question_text}</p>
                       </div>
                    </div>

                    {product && (
                       <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 min-w-[240px]">
                          {product.media?.[0] ? (
                             <img src={product.media[0].url} className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-gray-600" />
                          ) : (
                             <ProductIcon className="w-8 h-8 text-gray-400" />
                          )}
                          <div className="min-w-0">
                             <p className="text-[10px] text-gray-500 uppercase font-bold">Produto</p>
                             <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">{product.name}</p>
                          </div>
                       </div>
                    )}
                  </div>

                  {hasAnswer ? (
                    <div className="mt-4 bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/20 relative">
                        <div className="flex items-center gap-2 mb-1">
                           <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-500"/>
                           <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase">Sua Resposta</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">{q.answer_text}</p>
                        <button 
                            onClick={() => { setAnsweringId(q.id); setAnswerText(q.answer_text || ''); }}
                            className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline"
                        >
                            Editar
                        </button>
                    </div>
                  ) : answeringId === q.id ? (
                    <div className="mt-4 space-y-3 animate-fade-in">
                       <textarea 
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Digite sua resposta aqui..."
                          className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-indigo-50 focus:ring-1 focus:ring-primary outline-none"
                          rows={3}
                          autoFocus
                       />
                       <div className="flex justify-end gap-3">
                          <button onClick={() => setAnsweringId(null)} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-indigo-50">Cancelar</button>
                          <button onClick={() => handleSendAnswer(q)} className="bg-primary hover:bg-primary-dark text-indigo-50 px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95">Enviar Resposta</button>
                       </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex justify-between items-center">
                       <button onClick={() => setAnsweringId(q.id)} className="text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg border border-primary/20 transition-colors">
                          Responder agora
                       </button>
                       <button onClick={() => onDelete(q.id)} className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors">
                          <TrashIcon className="w-5 h-5"/>
                       </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuestionsAndAnswers;
