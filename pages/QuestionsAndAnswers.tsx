
import React, { useState, useMemo } from 'react';
import type { QuestionAndAnswer, Product, Customer, Toast } from '../types';
import { ChatIcon, TrashIcon, CheckCircleIcon, ProductIcon, SearchIcon } from '../components/icons/Icons';

interface QuestionsAndAnswersProps {
  questions: QuestionAndAnswer[];
  products: Product[];
  customers: Customer[];
  onUpdate: (q: QuestionAndAnswer) => void;
  onDelete: (id: string) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const QuestionsAndAnswers: React.FC<QuestionsAndAnswersProps> = ({ questions, products, customers, onUpdate, onDelete, showToast }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'answered'>('pending');
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
      showToast('Resposta enviada com sucesso!', 'success');
  };

  const filteredQuestions = useMemo(() => {
    const sorted = [...questions].sort((a, b) => b.question_date_integer - a.question_date_integer);
    if (activeTab === 'pending') {
      return sorted.filter(q => !q.answer_text);
    }
    return sorted.filter(q => !!q.answer_text);
  }, [questions, activeTab]);

  const pendingCount = questions.filter(q => !q.answer_text).length;
  const answeredCount = questions.filter(q => !!q.answer_text).length;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-indigo-50">Mensagens e Dúvidas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie as interações dos clientes em seus produtos.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Aguardando Resposta
          {pendingCount > 0 && (
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('answered')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'answered'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Respondidas
          <span className="text-gray-400 text-[10px] font-medium">({answeredCount})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
             <div className="bg-gray-50 dark:bg-gray-700/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhuma mensagem encontrada</h3>
             <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto mt-1">
               {activeTab === 'pending' 
                ? 'Bom trabalho! Você não tem perguntas pendentes no momento.' 
                : 'Você ainda não respondeu nenhuma pergunta.'}
             </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const product = getProduct(q.product_id);
            const customer = getCustomer(q.customer_id);
            const date = new Date(q.question_date_integer).toLocaleString('pt-BR');
            const hasAnswer = !!q.answer_text;

            return (
              <div key={q.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md animate-fade-in">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
                    <div className="flex items-start gap-4 flex-1">
                       <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600">
                          {customer?.avatarUrl ? (
                              <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full object-cover" />
                          ) : (
                              <ChatIcon className="text-primary w-6 h-6" />
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-black text-primary">
                                {customer ? customer.name : 'Cliente Visitante'}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">• {date}</span>
                          </div>
                          <p className="text-gray-900 dark:text-indigo-50 font-medium leading-relaxed break-words">{q.question_text}</p>
                       </div>
                    </div>

                    {product && (
                       <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 lg:max-w-[300px]">
                          <div className="w-12 h-12 shrink-0">
                            {product.media?.[0] ? (
                               <img src={product.media[0].url} className="w-full h-full rounded-lg object-cover border border-gray-200 dark:border-gray-600" alt={product.name} />
                            ) : (
                               <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                 <ProductIcon className="w-6 h-6 text-gray-400" />
                               </div>
                            )}
                          </div>
                          <div className="min-w-0">
                             <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tight">Produto Vinculado</p>
                             <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">{product.name}</p>
                             <p className="text-[9px] text-primary font-mono">{product.sku}</p>
                          </div>
                       </div>
                    )}
                  </div>

                  {hasAnswer ? (
                    <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/20 relative group">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                             <CheckCircleIcon className="w-4 h-4 text-white"/>
                           </div>
                           <span className="text-xs font-black text-green-600 dark:text-green-500 uppercase tracking-wider">Resposta Enviada</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-8">"{q.answer_text}"</p>
                        
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => { setAnsweringId(q.id); setAnswerText(q.answer_text || ''); }}
                                className="text-[10px] font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 bg-white dark:bg-gray-800 shadow-sm"
                            >
                                Editar
                            </button>
                            <button onClick={() => onDelete(q.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Excluir">
                              <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                  ) : answeringId === q.id ? (
                    <div className="space-y-4 animate-fade-in border-t border-gray-100 dark:border-gray-700 pt-6">
                       <div className="relative">
                          <textarea 
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value)}
                              placeholder="Escreva aqui sua resposta detalhada para o cliente..."
                              className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-indigo-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                              rows={4}
                              autoFocus
                          />
                          <div className="absolute bottom-3 right-3 text-[10px] font-bold text-gray-400">
                             {answerText.length} caracteres
                          </div>
                       </div>
                       <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => { setAnsweringId(null); setAnswerText(''); }} 
                            className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                          >
                            Descartar
                          </button>
                          <button 
                            onClick={() => handleSendAnswer(q)} 
                            className="bg-primary hover:bg-primary-dark text-indigo-50 px-8 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
                          >
                            Enviar Resposta
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-700 pt-4">
                       <button 
                          onClick={() => setAnsweringId(q.id)} 
                          className="group flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform"
                       >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                            <ChatIcon className="w-4 h-4"/>
                          </div>
                          Responder agora
                       </button>
                       <button onClick={() => onDelete(q.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
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
