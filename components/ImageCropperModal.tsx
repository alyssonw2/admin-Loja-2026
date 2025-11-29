import React, { useState, useRef, useEffect } from 'react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCrop: (croppedImage: string) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, onClose, imageSrc, onCrop }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        imgRef.current = img;
        // Reset state when new image loads. 
        // We can center the image initially or fit it.
        // A simple fit logic:
        const canvas = canvasRef.current;
        if(canvas) {
             const scaleX = canvas.width / img.width;
             const scaleY = canvas.height / img.height;
             const initialScale = Math.min(scaleX, scaleY, 1); // Fit within canvas, max 1
             setScale(Math.max(initialScale, 0.5)); // Ensure it's not too small
        } else {
             setScale(1);
        }
        setOffset({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Draw function
  const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const img = imgRef.current;
      if (!canvas || !ctx || !img) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background checkerboard for transparency indication
      const size = 20;
      for(let i=0; i<canvas.width; i+=size) {
        for(let j=0; j<canvas.height; j+=size) {
            ctx.fillStyle = (i/size + j/size) % 2 === 0 ? '#e5e7eb' : '#f3f4f6';
            ctx.fillRect(i, j, size, size);
        }
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.save();
      ctx.translate(centerX + offset.x, centerY + offset.y);
      ctx.scale(scale, scale);
      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
  };

  useEffect(() => {
      requestAnimationFrame(draw);
  }, [scale, offset, isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      setOffset({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y
      });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const handleSave = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          onCrop(dataUrl);
          onClose();
      }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg text-white">
        <h2 className="text-xl font-bold mb-4">Ajustar Logo</h2>
        <p className="text-sm text-gray-400 mb-4">Arraste para posicionar e use o slider para ajustar o tamanho.</p>
        
        <div className="flex justify-center mb-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg bg-gray-900 cursor-move overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={300}
                    height={300}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="touch-none"
                    style={{ display: 'block' }}
                />
            </div>
        </div>

        <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>- Zoom</span>
                <span>+ Zoom</span>
            </div>
            <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.05" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
            />
        </div>

        <div className="flex justify-end space-x-4">
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Cancelar</button>
            <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors">Confirmar e Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;