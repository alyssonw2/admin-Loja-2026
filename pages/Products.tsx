
import React, { useState, useMemo } from 'react';
import type { Product, Category, Brand, Model, Material, Color, Toast } from '../types';
import CategoryModal from '../components/CategoryModal';
import ColorModal from '../components/ColorModal';
import CatalogModal from '../components/CatalogModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { PencilIcon, TrashIcon, ProductIcon, SearchIcon, ChevronUpIcon, ChevronDownIcon } from '../components/icons/Icons';

type CatalogItem = { id: string; name: string };

interface CatalogTableProps {
  title: string;
  items: CatalogItem[];
  onAddClick: () => void;
  onEditClick: (item: CatalogItem) => void;
  onDeleteClick: (item: CatalogItem) => void;
}

const CatalogTable: React.FC<CatalogTableProps> = ({ title, items, onAddClick, onEditClick, onDeleteClick }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{`Gerenciar ${title}`}</h3>
            <button onClick={onAddClick} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                Adicionar Novo
            </button>
        </div>
        {items.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-4 text-gray-600 dark:text-gray-300">Nome</th>
                <th className="p-4 text-gray-600 dark:text-gray-300 w-40 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="p-4 space-x-4 text-right">
                    <button onClick={() => onEditClick(item)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"><PencilIcon/></button>
                    <button onClick={() => onDeleteClick(item)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center"><TrashIcon/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
};

interface ProductsProps {
  products: Product[];
  onAddProductClick: () => void;
  onEditProductClick: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  
  categories: Category[];
  addCategory: (item: Omit<Category, 'id'>) => void;
  updateCategory: (item: Category) => void;
  deleteCategory: (id: string) => void;

  brands: Brand[];
  addBrand: (item: Omit<Brand, 'id'>) => void;
  updateBrand: (item: Brand) => void;
  deleteBrand: (id: string) => void;

  models: Model[];
  addModel: (item: Omit<Model, 'id'>) => void;
  updateModel: (item: Model) => void;
  deleteModel: (id: string) => void;

  materials: Material[];
  addMaterial: (item: Omit<Material, 'id'>) => void;
  updateMaterial: (item: Material) => void;
  deleteMaterial: (id: string) => void;

  colors: Color[];
  addColor: (item: Omit<Color, 'id'>) => void;
  updateColor: (item: Color) => void;
  deleteColor: (id: string) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const Products: React.FC<ProductsProps> = (props) => {
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  
  // Specific Modals State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);

  // Deletion State
  const [deleteProductConfig, setDeleteProductConfig] = useState<{isOpen: boolean, product: Product | null}>({isOpen: false, product: null});

  // Generic Catalog Modal State (Brands, Models, Materials)
  const [catalogModalConfig, setCatalogModalConfig] = useState<{
    isOpen: boolean;
    type: 'brands' | 'models' | 'materials' | null;
    item: CatalogItem | null;
  }>({ isOpen: false, type: null, item: null });

  const { products, categories } = props;

  // --- Search and Sort Logic ---
  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerTerm) ||
        p.sku.toLowerCase().includes(lowerTerm)
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle string representation of numbers for sorting
        if (sortConfig.key === 'price' || sortConfig.key === 'stock') {
           const numA = parseFloat(aValue as string) || 0;
           const numB = parseFloat(bValue as string) || 0;
           if (numA < numB) return sortConfig.direction === 'asc' ? -1 : 1;
           if (numA > numB) return sortConfig.direction === 'asc' ? 1 : -1;
           return 0;
        }

        // Default string comparison
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [products, searchTerm, sortConfig]);

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: keyof Product }) => (
    <th className="p-4 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center gap-1">
        {label}
        {sortConfig?.key === sortKey && (
          sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  // --- Product Logic ---
  const handleRequestDeleteProduct = (product: Product) => {
      setDeleteProductConfig({ isOpen: true, product });
  };

  const handleConfirmDeleteProduct = () => {
      if (deleteProductConfig.product) {
          props.deleteProduct(deleteProductConfig.product.id);
          setDeleteProductConfig({ isOpen: false, product: null });
      }
  };

  // --- Category Logic ---
  const handleOpenCategoryModal = (category: Category | null = null) => {
      setEditingCategory(category);
      setIsCategoryModalOpen(true);
  };
  const handleCloseCategoryModal = () => {
      setEditingCategory(null);
      setIsCategoryModalOpen(false);
  };
  const handleSaveCategory = (categoryData: Category | Omit<Category, 'id'>) => {
      if ('id' in categoryData) {
          props.updateCategory(categoryData as Category);
      } else {
          props.addCategory(categoryData);
      }
  };
  const handleDeleteCategory = (category: Category) => {
      if (window.confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
          props.deleteCategory(category.id);
      }
  };

  // --- Color Logic ---
  const handleOpenColorModal = (color: Color | null = null) => {
    setEditingColor(color);
    setIsColorModalOpen(true);
  };
  const handleCloseColorModal = () => {
      setEditingColor(null);
      setIsColorModalOpen(false);
  };
  const handleSaveColor = (colorData: Color | Omit<Color, 'id'>) => {
      if ('id' in colorData) {
          props.updateColor(colorData as Color);
      } else {
          props.addColor(colorData);
      }
  };
  const handleDeleteColor = (color: Color) => {
      if (window.confirm(`Tem certeza que deseja excluir a cor "${color.name}"?`)) {
          props.deleteColor(color.id);
      }
  };

  // --- Generic Catalog Logic (Brand, Model, Material) ---
  const openCatalogModal = (type: 'brands' | 'models' | 'materials', item: CatalogItem | null = null) => {
    setCatalogModalConfig({ isOpen: true, type, item });
  };

  const closeCatalogModal = () => {
    setCatalogModalConfig({ isOpen: false, type: null, item: null });
  };

  const handleSaveCatalogItem = (name: string, id?: string) => {
    const { type } = catalogModalConfig;
    if (!type) return;

    switch (type) {
      case 'brands':
        if (id) props.updateBrand({ id, name });
        else props.addBrand({ name });
        break;
      case 'models':
        if (id) props.updateModel({ id, name });
        else props.addModel({ name });
        break;
      case 'materials':
        if (id) props.updateMaterial({ id, name });
        else props.addMaterial({ name });
        break;
    }
  };

  const handleDeleteCatalogItem = (type: 'brands' | 'models' | 'materials', item: CatalogItem) => {
    if (window.confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
      switch (type) {
        case 'brands': props.deleteBrand(item.id); break;
        case 'models': props.deleteModel(item.id); break;
        case 'materials': props.deleteMaterial(item.id); break;
      }
    }
  };

  // --- Helpers ---
  const hierarchicalCategories = useMemo(() => {
    const topLevel = categories.filter(c => !c.parentId);
    const result: (Category & { level: number })[] = [];

    const buildHierarchy = (cats: Category[], level: number) => {
        cats.forEach(cat => {
            result.push({ ...cat, level });
            const children = categories.filter(c => c.parentId === cat.id);
            if (children.length > 0) {
                buildHierarchy(children, level + 1);
            }
        });
    }

    buildHierarchy(topLevel, 0);
    return result;
  }, [categories]);

  const tabs = [
    { id: 'products', label: 'Produtos' },
    { id: 'categories', label: 'Categorias' },
    { id: 'brands', label: 'Marcas' },
    { id: 'models', label: 'Modelos' },
    { id: 'materials', label: 'Materiais' },
    { id: 'colors', label: 'Cores' },
  ];

  const getCatalogModalTitle = () => {
    const { type, item } = catalogModalConfig;
    const action = item ? 'Editar' : 'Adicionar';
    switch (type) {
      case 'brands': return `${action} Marca`;
      case 'models': return `${action} Modelo`;
      case 'materials': return `${action} Material`;
      default: return '';
    }
  };
  
  const getCatalogItemName = () => {
    switch (catalogModalConfig.type) {
        case 'brands': return 'Marca';
        case 'models': return 'Modelo';
        case 'materials': return 'Material';
        default: return 'Item';
    }
  }

  // Calculate total stock from sizes if available
  const getProductStock = (product: Product) => {
      if (product.sizes && product.sizes.length > 0) {
          return product.sizes.reduce((acc, curr) => acc + curr.quantity, 0);
      }
      return product.stock;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Produtos e Catálogos</h2>
        {activeTab === 'products' && (
            <button onClick={props.onAddProductClick} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
              Adicionar Produto
            </button>
        )}
        {activeTab === 'categories' && (
            <button onClick={() => handleOpenCategoryModal()} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                Adicionar Categoria
            </button>
        )}
        {activeTab === 'colors' && (
            <button onClick={() => handleOpenColorModal()} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                Adicionar Cor
            </button>
        )}
        {activeTab === 'brands' && (
            <button onClick={() => openCatalogModal('brands')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                Adicionar Marca
            </button>
        )}
        {activeTab === 'models' && (
            <button onClick={() => openCatalogModal('models')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                Adicionar Modelo
            </button>
        )}
        {activeTab === 'materials' && (
            <button onClick={() => openCatalogModal('materials')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                Adicionar Material
            </button>
        )}
      </div>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                          activeTab === tab.id
                              ? 'border-primary text-primary'
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                      {tab.label}
                  </button>
              ))}
          </nav>
      </div>

      {activeTab === 'products' && (
        <>
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="text-gray-400 w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-1/2 lg:w-1/3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <SortHeader label="Produto" sortKey="name" />
                  <SortHeader label="SKU" sortKey="sku" />
                  <SortHeader label="Preço" sortKey="price" />
                  <SortHeader label="Estoque" sortKey="stock" />
                  <SortHeader label="Status" sortKey="status" />
                  <SortHeader label="Data Cadastro" sortKey="createdAt" />
                  <th className="p-4 text-gray-600 dark:text-gray-300 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Nenhum produto encontrado para a busca.' : 'Nenhum produto cadastrado.'}
                    </td>
                  </tr>
                ) : (filteredAndSortedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 flex items-center">
                      {product.media && product.media.length > 0 ? (
                          <img src={product.media[0].url} alt={product.name} className="w-12 h-12 rounded-md mr-4 object-cover bg-gray-200 dark:bg-gray-700" />
                      ) : (
                          <div className="w-12 h-12 rounded-md mr-4 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <ProductIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                          </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{product.sku}</td>
                    <td className="p-4 text-gray-900 dark:text-white">
                        {product.promotionalPrice && parseFloat(product.promotionalPrice) > 0 ? (
                            <div className="flex flex-col">
                                <span className="text-red-400 font-bold">R$ {Number(product.promotionalPrice).toFixed(2)}</span>
                                <span className="text-xs text-gray-500 line-through">R$ {Number(product.price).toFixed(2)}</span>
                            </div>
                        ) : (
                            <span>R$ {Number(product.price).toFixed(2)}</span>
                        )}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white">{getProductStock(product)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.status === 'Ativo' ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 space-x-4 text-right">
                      <button onClick={() => props.onEditProductClick(product)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"><PencilIcon /></button>
                      <button onClick={() => handleRequestDeleteProduct(product)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center"><TrashIcon /></button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-4 text-gray-600 dark:text-gray-300">Nome da Categoria</th>
                <th className="p-4 text-gray-600 dark:text-gray-300 w-40 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {hierarchicalCategories.length === 0 ? (
                 <tr>
                  <td colSpan={2} className="text-center p-8 text-gray-500 dark:text-gray-400">Nenhuma categoria cadastrada.</td>
                </tr>
              ) : (hierarchicalCategories.map(cat => (
                <tr key={cat.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4 font-medium text-gray-900 dark:text-white" style={{ paddingLeft: `${1 + cat.level * 2}rem` }}>
                    {cat.level > 0 && <span className="text-gray-400 dark:text-gray-500 mr-2">↳</span>}
                    {cat.name}
                  </td>
                  <td className="p-4 space-x-4 text-right">
                    <button onClick={() => handleOpenCategoryModal(cat)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"><PencilIcon /></button>
                    <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><TrashIcon /></button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'brands' && (
        <CatalogTable 
          title="Marcas" 
          items={props.brands} 
          onAddClick={() => openCatalogModal('brands')}
          onEditClick={(item) => openCatalogModal('brands', item)}
          onDeleteClick={(item) => handleDeleteCatalogItem('brands', item)}
        />
      )}
      
      {activeTab === 'models' && (
        <CatalogTable 
          title="Modelos" 
          items={props.models} 
          onAddClick={() => openCatalogModal('models')}
          onEditClick={(item) => openCatalogModal('models', item)}
          onDeleteClick={(item) => handleDeleteCatalogItem('models', item)}
        />
      )}

      {activeTab === 'materials' && (
        <CatalogTable 
          title="Materiais" 
          items={props.materials} 
          onAddClick={() => openCatalogModal('materials')}
          onEditClick={(item) => openCatalogModal('materials', item)}
          onDeleteClick={(item) => handleDeleteCatalogItem('materials', item)}
        />
      )}
      
      {activeTab === 'colors' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-4 text-gray-600 dark:text-gray-300 w-20">Cor</th>
                <th className="p-4 text-gray-600 dark:text-gray-300">Nome</th>
                <th className="p-4 text-gray-600 dark:text-gray-300">Hex</th>
                <th className="p-4 text-gray-600 dark:text-gray-300 w-40 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {props.colors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-gray-500 dark:text-gray-400">Nenhuma cor cadastrada.</td>
                </tr>
              ) : (props.colors.map(color => (
                <tr key={color.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4">
                    <span className="block w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600" style={{ backgroundColor: color.hex }}></span>
                  </td>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">{color.name}</td>
                  <td className="p-4 font-mono text-gray-500 dark:text-gray-400">{color.hex.toUpperCase()}</td>
                  <td className="p-4 space-x-4 text-right">
                    <button onClick={() => handleOpenColorModal(color)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"><PencilIcon /></button>
                    <button onClick={() => handleDeleteColor(color)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><TrashIcon /></button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}
      
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        onSave={handleSaveCategory}
        category={editingCategory}
        allCategories={props.categories}
        showToast={props.showToast}
      />
      <ColorModal
        isOpen={isColorModalOpen}
        onClose={handleCloseColorModal}
        onSave={handleSaveColor}
        color={editingColor}
        showToast={props.showToast}
      />
      
      <CatalogModal
        isOpen={catalogModalConfig.isOpen}
        onClose={closeCatalogModal}
        onSave={handleSaveCatalogItem}
        item={catalogModalConfig.item}
        title={getCatalogModalTitle()}
        itemName={getCatalogItemName()}
        showToast={props.showToast}
      />

      <ConfirmationModal
        isOpen={deleteProductConfig.isOpen}
        onClose={() => setDeleteProductConfig({ isOpen: false, product: null })}
        onConfirm={handleConfirmDeleteProduct}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${deleteProductConfig.product?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Products;
