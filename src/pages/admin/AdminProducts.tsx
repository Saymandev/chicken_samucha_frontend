import { motion } from 'framer-motion';
import {
  Edit,
  Eye,
  Package,
  Plus,
  Search,
  Star,
  Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ProductFormModal from '../../components/admin/ProductFormModal';
import { useStore } from '../../store/useStore';
import { adminAPI } from '../../utils/api';

interface Product {
  _id: string;
  name: { en: string; bn: string };
  description: { en: string; bn: string };
  price: number;
  discountPrice?: number;
  images: Array<{ url: string; public_id: string }>;
  category: { en: string; bn: string };
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  ratings: { average: number; count: number };
  createdAt: string;
}

const AdminProducts: React.FC = () => {
  const { language } = useStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedCategory, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`
      };
      
      const response = await adminAPI.getAllProducts(params);
      
      if (response.data.success) {
        setProducts(response.data.products || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await adminAPI.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      const formData = new FormData();
      formData.append('isAvailable', (!product.isAvailable).toString());
      await adminAPI.updateProduct(product._id, formData);
      toast.success(`Product ${!product.isAvailable ? 'enabled' : 'disabled'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const formData = new FormData();
      formData.append('isFeatured', (!product.isFeatured).toString());
      await adminAPI.updateProduct(product._id, formData);
      toast.success(`Product ${!product.isFeatured ? 'featured' : 'unfeatured'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleModalSuccess = () => {
    fetchProducts();
    handleModalClose();
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'samosa', label: 'Samosa' },
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'snack', label: 'Snack' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'stock', label: 'Stock' },
    { value: 'ratings.average', label: 'Rating' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Product Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your product catalog, inventory, and pricing
            </p>
          </div>
          <button 
            onClick={handleAddProduct}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].url}
                    alt={language === 'bn' ? product.name.bn : product.name.en}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                <div className="absolute top-2 left-2 flex gap-2">
                  {product.isFeatured && (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.isAvailable 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {product.stock < 20 && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      Low Stock
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {language === 'bn' ? product.name?.bn || product.name?.en : product.name?.en}
                </h3>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {product.ratings?.average?.toFixed(1) || '0.0'} ({product.ratings?.count || 0})
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Stock: {product.stock || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {product.discountPrice ? (
                    <>
                      <span className="text-lg font-bold text-orange-500">
                        ৳{product.discountPrice}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ৳{product.price}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ৳{product.price}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mb-2">
                  <Link
                    to={`/products/${product._id}`}
                    className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAvailability(product)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                      product.isAvailable
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {product.isAvailable ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => toggleFeatured(product)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                      product.isFeatured
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {product.isFeatured ? 'Unfeature' : 'Feature'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === i + 1
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first product'}
            </p>
            <button 
              onClick={handleAddProduct}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Add Your First Product
            </button>
          </div>
        )}

        {/* Product Form Modal */}
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          product={editingProduct}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default AdminProducts; 