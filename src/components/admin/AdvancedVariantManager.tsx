import { motion } from 'framer-motion';
import {
    Droplets,
    Edit,
    Package,
    Palette,
    Ruler,
    Settings,
    Shirt,
    Trash2,
    Weight,
    X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Product, ProductAttribute, ProductVariant, VariantAttribute, VariantAttributeValue } from '../../store/useStore';

interface AdvancedVariantManagerProps {
  product: Product;
  onVariantsChange: (variants: ProductVariant[], variantAttributes: VariantAttribute[]) => void;
  className?: string;
}

const AdvancedVariantManager: React.FC<AdvancedVariantManagerProps> = ({
  product,
  onVariantsChange,
  className = ''
}) => {
  const [hasVariants, setHasVariants] = useState(product.hasVariants || false);
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>(product.variantAttributes || []);
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [newAttribute, setNewAttribute] = useState<Partial<VariantAttribute>>({
    name: '',
    type: 'custom',
    values: [],
    isRequired: false,
    affectsPrice: false,
    affectsStock: true,
    affectsImage: false
  });

  // Update parent when variants change
  useEffect(() => {
    onVariantsChange(variants, variantAttributes);
  }, [variants, variantAttributes, onVariantsChange]);

  // Generate all possible variant combinations
  const generateVariants = () => {
    if (variantAttributes.length === 0) return;

    const combinations: ProductAttribute[][] = [];
    
    const generateCombinations = (current: ProductAttribute[] = [], index = 0) => {
      if (index === variantAttributes.length) {
        combinations.push([...current]);
        return;
      }

      const config = variantAttributes[index];
      config.values.forEach(value => {
        generateCombinations([...current, {
          attributeName: config.name,
          attributeType: config.type,
          value: value.value,
          unit: value.unit,
          colorCode: value.colorCode
        }], index + 1);
      });
    };

    generateCombinations();
    
    // Create variants from combinations
    const newVariants: ProductVariant[] = combinations.map((attributes, index) => {
      const existingVariant = variants.find(v => 
        attributes.every(attr => 
          v.attributes.some(vAttr => 
            vAttr.attributeName === attr.attributeName && 
            vAttr.value === attr.value && 
            (vAttr.unit || '') === (attr.unit || '')
          )
        )
      );

      if (existingVariant) return existingVariant;

      return {
        _id: `variant_${Date.now()}_${index}`,
        sku: generateSKU(product.name.en, attributes),
        attributes,
        price: calculateVariantPrice(attributes),
        stock: 0,
        images: [],
        isAvailable: true
      };
    });

    setVariants(newVariants);
  };

  // Generate SKU
  const generateSKU = (productName: string, attributes: ProductAttribute[]): string => {
    const baseSKU = productName.replace(/\s+/g, '').toUpperCase().substring(0, 6);
    const attrCode = attributes.map(attr => 
      attr.value.replace(/\s+/g, '').toUpperCase().substring(0, 2)
    ).join('');
    
    return `${baseSKU}-${attrCode}-${Date.now().toString().slice(-4)}`;
  };

  // Calculate variant price
  const calculateVariantPrice = (attributes: ProductAttribute[]): number => {
    let price = product.price;
    
    attributes.forEach(attr => {
      const variantAttr = variantAttributes.find(va => va.name === attr.attributeName);
      if (variantAttr?.affectsPrice) {
        const value = variantAttr.values.find(v => v.value === attr.value);
        if (value?.priceModifier) {
          price += value.priceModifier;
        }
      }
    });
    
    return Math.round(price * 100) / 100;
  };

  // Add new attribute
  const addAttribute = () => {
    if (!newAttribute.name?.trim()) return;

    const attribute: VariantAttribute = {
      name: newAttribute.name.trim(),
      type: newAttribute.type as any,
      displayName: {
        en: newAttribute.displayName?.en || newAttribute.name.trim(),
        bn: newAttribute.displayName?.bn || newAttribute.name.trim()
      },
      values: newAttribute.values || [],
      isRequired: newAttribute.isRequired || false,
      affectsPrice: newAttribute.affectsPrice || false,
      affectsStock: newAttribute.affectsStock || true,
      affectsImage: newAttribute.affectsImage || false
    };

    setVariantAttributes([...variantAttributes, attribute]);
    setNewAttribute({
      name: '',
      type: 'custom',
      values: [],
      isRequired: false,
      affectsPrice: false,
      affectsStock: true,
      affectsImage: false
    });
  };

  // Add value to attribute
  const addValueToAttribute = (attributeIndex: number, value: Partial<VariantAttributeValue>) => {
    if (!value.value?.trim()) return;

    const updatedAttributes = [...variantAttributes];
    updatedAttributes[attributeIndex].values.push({
      value: value.value.trim(),
      displayName: {
        en: value.displayName?.en || value.value.trim(),
        bn: value.displayName?.bn || value.value.trim()
      },
      unit: value.unit?.trim(),
      colorCode: value.colorCode?.trim(),
      imageUrl: value.imageUrl?.trim(),
      priceModifier: value.priceModifier || 0,
      stockModifier: value.stockModifier || 0
    });
    setVariantAttributes(updatedAttributes);
  };

  // Remove value from attribute
  const removeValueFromAttribute = (attributeIndex: number, valueIndex: number) => {
    const updatedAttributes = [...variantAttributes];
    updatedAttributes[attributeIndex].values.splice(valueIndex, 1);
    setVariantAttributes(updatedAttributes);
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    const updatedAttributes = variantAttributes.filter((_, i) => i !== index);
    setVariantAttributes(updatedAttributes);
  };

  // Update variant
  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setVariants(prev => prev.map(v => 
      v._id === variantId ? { ...v, ...updates } : v
    ));
  };

  // Remove variant
  const removeVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v._id !== variantId));
  };

  // Get attribute icon
  const getAttributeIcon = (type: string) => {
    switch (type) {
      case 'color': return <Palette className="w-4 h-4" />;
      case 'size': return <Ruler className="w-4 h-4" />;
      case 'weight': return <Weight className="w-4 h-4" />;
      case 'volume': return <Droplets className="w-4 h-4" />;
      case 'material': return <Shirt className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enable Variants Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Advanced Product Variants</h3>
          <p className="text-sm text-gray-600">Enable variants to add different options like color, size, weight, volume, etc.</p>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Enable Variants</span>
        </label>
      </div>

      {hasVariants && (
        <>
          {/* Attributes Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900">Variant Attributes Configuration</h4>
            
            {/* Existing Attributes */}
            {variantAttributes.map((config, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    {getAttributeIcon(config.type)}
                    <span className="font-medium text-gray-900">{config.name}</span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {config.type}
                    </span>
                    {config.isRequired && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        Required
                      </span>
                    )}
                    {config.affectsPrice && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Affects Price
                      </span>
                    )}
                    {config.affectsImage && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        Affects Image
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeAttribute(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Values */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Values:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {config.values.map((value, valueIndex) => (
                      <div
                        key={valueIndex}
                        className="flex items-center gap-2 p-2 bg-gray-100 rounded text-sm"
                      >
                        {config.type === 'color' && value.colorCode && (
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: value.colorCode }}
                          />
                        )}
                        <span>{value.value}</span>
                        {value.unit && <span className="text-gray-500">({value.unit})</span>}
                         {(value.priceModifier || 0) !== 0 && (
                           <span className="text-green-600 text-xs">
                             {(value.priceModifier || 0) > 0 ? '+' : ''}{value.priceModifier || 0}
                           </span>
                         )}
                        <button
                          onClick={() => removeValueFromAttribute(index, valueIndex)}
                          className="text-red-500 hover:text-red-700 ml-auto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Value Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-gray-50 rounded">
                    <input
                      type="text"
                      placeholder="Value"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          addValueToAttribute(index, { value: input.value });
                          input.value = '';
                        }
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Unit (optional)"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    {config.type === 'color' && (
                      <input
                        type="color"
                        placeholder="Color"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    )}
                    <input
                      type="number"
                      placeholder="Price Modifier"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add New Attribute */}
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Add New Attribute</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Attribute Name (e.g., Color, Size, Weight)"
                  value={newAttribute.name || ''}
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <select
                  value={newAttribute.type || 'custom'}
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, type: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
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
              
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newAttribute.isRequired || false}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newAttribute.affectsPrice || false}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, affectsPrice: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Affects Price</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newAttribute.affectsImage || false}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, affectsImage: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Affects Image</span>
                </label>
                <button
                  onClick={addAttribute}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                >
                  Add Attribute
                </button>
              </div>
            </div>
          </div>

          {/* Generate Variants Button */}
          {variantAttributes.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={generateVariants}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Generate Variants ({variantAttributes.reduce((acc, config) => acc * config.values.length, 1)} combinations)
              </button>
            </div>
          )}

          {/* Variants List */}
          {variants.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900">Product Variants ({variants.length})</h4>
              
              <div className="space-y-3">
                {variants.map((variant) => (
                  <motion.div 
                    key={variant._id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900">
                          {variant.attributes.map(attr => 
                            `${attr.attributeName}: ${attr.value}${attr.unit ? ` (${attr.unit})` : ''}`
                          ).join(', ')}
                        </span>
                        <span className="text-sm text-gray-500">SKU: {variant.sku}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingVariant(editingVariant === variant._id ? null : variant._id)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeVariant(variant._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Variant Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Price (৳)</label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(variant._id, { price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Discount Price (৳)</label>
                        <input
                          type="number"
                          value={variant.discountPrice || ''}
                          onChange={(e) => updateVariant(variant._id, { discountPrice: parseFloat(e.target.value) || undefined })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Stock</label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(variant._id, { stock: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={variant.isAvailable}
                          onChange={(e) => updateVariant(variant._id, { isAvailable: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">Available</span>
                      </label>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedVariantManager;
