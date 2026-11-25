import React, { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { MEDIA_ASSETS } from '../data/seedData';
import { AvailabilityStatus, MenuItem } from '../types/zaiqa';
import { FoodImage } from './StatusBadge';

interface MenuManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<MenuItem, 'id'> & { id?: string }) => void;
  categories: string[];
  editingItem?: MenuItem | null;
}

const PRESET_IMAGES = [
  { label: 'Shawarma', url: MEDIA_ASSETS.shawarma },
  { label: 'Burger', url: MEDIA_ASSETS.burger },
  { label: 'Pizza', url: MEDIA_ASSETS.pizza },
  { label: 'Fries', url: MEDIA_ASSETS.fries },
  { label: 'Nuggets', url: MEDIA_ASSETS.nuggets },
  { label: 'Drinks', url: MEDIA_ASSETS.drinks },
];

export const MenuManagerModal: React.FC<MenuManagerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingItem = null,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'Shawarma');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(MEDIA_ASSETS.shawarma);
  const [availability, setAvailability] = useState<AvailabilityStatus>('Available');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setPrice(String(editingItem.price));
      setDescription(editingItem.description);
      setImageUrl(editingItem.imageUrl);
      setAvailability(editingItem.availability);
    } else {
      setName('');
      setCategory(categories[0] ?? 'Shawarma');
      setPrice('');
      setDescription('');
      setImageUrl(MEDIA_ASSETS.shawarma);
      setAvailability('Available');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingItem?.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number.parseFloat(price);
    if (!name.trim()) {
      setError('Please enter a product name.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Please enter a valid price greater than 0.');
      return;
    }
    onSave({
      id: editingItem?.id,
      name: name.trim(),
      category,
      description: description.trim() || 'Freshly prepared to order at ZAIQA Kitchen.',
      price: Math.round(numericPrice),
      imageUrl: imageUrl.trim(),
      availability,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-modal-title"
    >
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-xl shadow-xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#141210] text-white">
          <h2 id="menu-modal-title" className="text-base font-semibold">
            {editingItem ? `Edit ${editingItem.name}` : 'Add Menu Item'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu item modal"
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-800"
            >
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="menu-item-name"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Product Name *
              </label>
              <input
                id="menu-item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zaiqa Arabic Shawarma"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="menu-item-cat"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Category
              </label>
              <select
                id="menu-item-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="menu-item-price"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Price (Rs.) *
              </label>
              <input
                id="menu-item-price"
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 550"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="menu-item-avail"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Availability Status
              </label>
              <select
                id="menu-item-avail"
                value={availability}
                onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="menu-item-desc"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="menu-item-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredients, portion size, spice profile..."
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Image URL, Upload & Preview */}
          <div className="space-y-2.5">
            <label
              htmlFor="menu-item-img-url"
              className="block text-xs font-semibold text-stone-700"
            >
              Product Image (URL or File Upload)
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-28 h-20 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-900">
                <FoodImage
                  src={imageUrl}
                  alt={name || 'Product preview'}
                  titleFallback={name || 'Preview'}
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <input
                  id="menu-item-img-url"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL or upload below"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-300 bg-stone-50 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className="px-2 py-1 rounded-md border border-stone-200 text-[11px] font-medium text-stone-600 hover:border-amber-400 hover:text-stone-900 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 text-stone-950 text-sm font-semibold hover:bg-amber-400 cursor-pointer"
            >
              {editingItem ? 'Save Item' : 'Add to Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
