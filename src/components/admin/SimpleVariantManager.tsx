import { Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { ProductVariant, VariantAttribute } from '../../store/useStore';

interface SimpleVariantManagerProps {
  variantAttributes: VariantAttribute[];
  setVariantAttributes: (attrs: VariantAttribute[]) => void;
  variants: ProductVariant[];
  setVariants: (variants: ProductVariant[]) => void;
  language: 'en' | 'bn';
}

const SimpleVariantManager: React.FC<SimpleVariantManagerProps> = ({
  variantAttributes,
  setVariantAttributes,
  variants,
  setVariants,
  language
}) => {
  const [editingAttribute, setEditingAttribute] = useState<number | null>(null);
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    type: 'custom' as const,
    displayName: { en: '', bn: '' },
    isRequired: true,
    affectsPrice: false,
    affectsStock: false,
    affectsImage: false,
    values: [] as Array<{
      value: string;
      displayName?: { en?: string; bn?: string };
      unit?: string;
      colorCode?: string;
      imageUrl?: string;
      priceModifier?: number;
      stockModifier?: number;
    }>
  });

  const handleAddAttribute = () => {
    if (newAttribute.name.trim()) {
      const attribute: VariantAttribute = {
        ...newAttribute,
        displayName: {
          en: newAttribute.displayName.en || newAttribute.name,
          bn: newAttribute.displayName.bn || newAttribute.name
        }
      };
      setVariantAttributes([...variantAttributes, attribute]);
      setNewAttribute({
        name: '',
        type: 'custom',
        displayName: { en: '', bn: '' },
        isRequired: true,
        affectsPrice: false,
        affectsStock: false,
        affectsImage: false,
        values: []
      });
    }
  };

  const handleDeleteAttribute = (index: number) => {
    const newAttrs = variantAttributes.filter((_, i) => i !== index);
    setVariantAttributes(newAttrs);
  };

  const handleAddValue = (attrIndex: number) => {
    const newAttrs = [...variantAttributes];
    newAttrs[attrIndex].values.push({
      value: '',
      displayName: { en: '', bn: '' },
      unit: '',
      colorCode: '',
      priceModifier: 0,
      stockModifier: 0
    });
    setVariantAttributes(newAttrs);
  };

  const handleUpdateValue = (attrIndex: number, valueIndex: number, field: string, value: any) => {
    const newAttrs = [...variantAttributes];
    newAttrs[attrIndex].values[valueIndex] = {
      ...newAttrs[attrIndex].values[valueIndex],
      [field]: value
    };
    setVariantAttributes(newAttrs);
  };

  const handleDeleteValue = (attrIndex: number, valueIndex: number) => {
    const newAttrs = [...variantAttributes];
    newAttrs[attrIndex].values = newAttrs[attrIndex].values.filter((_, i) => i !== valueIndex);
    setVariantAttributes(newAttrs);
  };

  const generateVariants = () => {
    if (variantAttributes.length === 0) return;

    // Simple variant generation - creates all combinations
    const generateCombinations = (attrs: VariantAttribute[], index = 0, current: any[] = []): any[] => {
      if (index === attrs.length) {
        return [current];
      }

      const combinations: any[] = [];
      for (const value of attrs[index].values) {
        combinations.push(...generateCombinations(attrs, index + 1, [...current, {
          attributeName: attrs[index].name,
          attributeType: attrs[index].type,
          value: value.value,
          unit: value.unit || '',
          colorCode: value.colorCode || ''
        }]));
      }
      return combinations;
    };

    const combinations = generateCombinations(variantAttributes);
    const newVariants: ProductVariant[] = combinations.map((combo, index) => ({
      _id: `variant_${Date.now()}_${index}`,
      sku: `SKU-${Date.now()}-${index}`,
      attributes: combo,
      price: 0, // Will be set by admin
      discountPrice: 0,
      stock: 0, // Will be set by admin
      images: [],
      isAvailable: true,
      weight: undefined,
      dimensions: undefined,
      barcode: '',
      customFields: {}
    }));

    setVariants(newVariants);
  };

  return (
    <div className="space-y-6">
      {/* Add New Attribute */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Add New Attribute
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Attribute name (e.g., Color, Size)"
            value={newAttribute.name}
            onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <select
            value={newAttribute.type}
            onChange={(e) => setNewAttribute({ ...newAttribute, type: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="color">Color</option>
            <option value="size">Size</option>
            <option value="weight">Weight</option>
            <option value="volume">Volume</option>
            <option value="material">Material</option>
            <option value="style">Style</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <input
            type="text"
            placeholder="Display Name (English)"
            value={newAttribute.displayName.en}
            onChange={(e) => setNewAttribute({ 
              ...newAttribute, 
              displayName: { ...newAttribute.displayName, en: e.target.value }
            })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            placeholder="Display Name (Bengali)"
            value={newAttribute.displayName.bn}
            onChange={(e) => setNewAttribute({ 
              ...newAttribute, 
              displayName: { ...newAttribute.displayName, bn: e.target.value }
            })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newAttribute.affectsPrice}
              onChange={(e) => setNewAttribute({ ...newAttribute, affectsPrice: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Affects Price</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newAttribute.affectsStock}
              onChange={(e) => setNewAttribute({ ...newAttribute, affectsStock: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Affects Stock</span>
          </label>
        </div>
        <button
          onClick={handleAddAttribute}
          className="mt-3 w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Attribute
        </button>
      </div>

      {/* Existing Attributes */}
      {variantAttributes.map((attr, attrIndex) => (
        <div key={attrIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {attr.displayName?.[language] || attr.name} ({attr.type})
            </h4>
            <button
              onClick={() => handleDeleteAttribute(attrIndex)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Attribute Values */}
          <div className="space-y-2">
            {attr.values.map((value, valueIndex) => (
              <div key={valueIndex} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <input
                  type="text"
                  placeholder="Value"
                  value={value.value}
                  onChange={(e) => handleUpdateValue(attrIndex, valueIndex, 'value', e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                {attr.type === 'color' && (
                  <input
                    type="color"
                    value={value.colorCode || '#000000'}
                    onChange={(e) => handleUpdateValue(attrIndex, valueIndex, 'colorCode', e.target.value)}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded"
                  />
                )}
                <input
                  type="text"
                  placeholder="Unit"
                  value={value.unit || ''}
                  onChange={(e) => handleUpdateValue(attrIndex, valueIndex, 'unit', e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Price Modifier"
                  value={value.priceModifier || 0}
                  onChange={(e) => handleUpdateValue(attrIndex, valueIndex, 'priceModifier', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => handleDeleteValue(attrIndex, valueIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => handleAddValue(attrIndex)}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Value
            </button>
          </div>
        </div>
      ))}

      {/* Generate Variants Button */}
      {variantAttributes.length > 0 && (
        <div className="text-center">
          <button
            onClick={generateVariants}
            className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Generate Variants ({variantAttributes.reduce((acc, attr) => acc * attr.values.length, 1)} combinations)
          </button>
        </div>
      )}

      {/* Generated Variants */}
      {variants.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Generated Variants ({variants.length})
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {variants.map((variant, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                <div>
                  <span className="font-medium">SKU: {variant.sku}</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {variant.attributes.map(attr => `${attr.attributeName}: ${attr.value}`).join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Price"
                    value={variant.price}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].price = parseFloat(e.target.value) || 0;
                      setVariants(newVariants);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={variant.stock}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].stock = parseInt(e.target.value) || 0;
                      setVariants(newVariants);
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleVariantManager;
