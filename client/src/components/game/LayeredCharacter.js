import { useState, useCallback } from 'react';
import './LayeredCharacter.css';

/**
 * LayeredCharacter — Composites pixel-art sprite layers into a single character preview.
 *
 * Props:
 *   config   — { base_character, headgear, outfit, accessories, effects_back, effects_front, badge, background }
 *   size     — 'sm' | 'md' | 'lg' (64px / 128px / 256px)
 *   animated — boolean, enables breathing animation
 *   previewItem — optional { category, id } to overlay as a preview highlight
 */

const CATEGORY_TO_FOLDER = {
  headgear: 'headgear',
  outfit: 'outfits',
  accessories: 'accessories',
  effects_back: 'effects_back',
  effects_front: 'effects_front',
  badge: 'badges',
  background: 'backgrounds',
};

function getSpritePath(category, itemId) {
  if (!itemId) return null;
  const folder = CATEGORY_TO_FOLDER[category];
  if (!folder) return null;
  return `/sprites/customisation/${folder}/${itemId}.png`;
}

function getBasePath(baseCharacter) {
  if (!baseCharacter) return null;
  return `/sprites/customisation/base/${baseCharacter}.png`;
}

/**
 * Resolves the preview item into the correct layer category.
 * Effects items from the catalogue use category 'effects' but we split into back/front.
 * Default preview for effects goes to effects_front.
 */
function resolvePreviewCategory(item) {
  if (!item) return null;
  if (item.category === 'effects') return 'effects_front';
  return item.category;
}

function LayeredCharacter({ config = {}, size = 'md', animated = false, previewItem = null }) {
  const [hiddenLayers, setHiddenLayers] = useState({});

  const handleError = useCallback((layerKey) => {
    setHiddenLayers((prev) => ({ ...prev, [layerKey]: true }));
  }, []);

  const handleLoad = useCallback((layerKey) => {
    setHiddenLayers((prev) => {
      if (!prev[layerKey]) return prev;
      const next = { ...prev };
      delete next[layerKey];
      return next;
    });
  }, []);

  // Determine what to show in each slot, with preview override
  const previewCategory = resolvePreviewCategory(previewItem);
  const getEffectiveItem = (category) => {
    if (previewItem && previewCategory === category) {
      return previewItem.id;
    }
    return config[category] || null;
  };

  const layers = [
    { key: 'background', category: 'background', className: 'layered-character__layer--background' },
    { key: 'effects_back', category: 'effects_back', className: 'layered-character__layer--effects-back' },
    { key: 'base', category: null, className: 'layered-character__layer--base' },
    { key: 'outfit', category: 'outfit', className: 'layered-character__layer--outfit' },
    { key: 'accessories', category: 'accessories', className: 'layered-character__layer--accessories' },
    { key: 'headgear', category: 'headgear', className: 'layered-character__layer--headgear' },
    { key: 'effects_front', category: 'effects_front', className: 'layered-character__layer--effects-front' },
    { key: 'badge', category: 'badge', className: 'layered-character__layer--badge' },
  ];

  const containerClass = [
    'layered-character',
    `size-${size}`,
    animated ? 'layered-character--animated' : '',
  ].filter(Boolean).join(' ');

  const hasBase = config.base_character || (previewItem && previewCategory === 'base');

  return (
    <div className={containerClass}>
      {layers.map(({ key, category, className }) => {
        let src;
        let isPreview = false;

        if (key === 'base') {
          const baseId = previewItem && previewCategory === 'base'
            ? previewItem.id
            : config.base_character;
          src = getBasePath(baseId);
          isPreview = previewItem && previewCategory === 'base';
        } else {
          const itemId = getEffectiveItem(category);
          src = getSpritePath(category, itemId);
          isPreview = previewItem && previewCategory === category;
        }

        if (!src || hiddenLayers[key]) return null;

        const layerClasses = [
          'layered-character__layer',
          className,
          isPreview ? 'layered-character__layer--preview' : '',
        ].filter(Boolean).join(' ');

        return (
          <img
            key={key}
            className={layerClasses}
            src={src}
            alt={key}
            onError={() => handleError(key)}
            onLoad={() => handleLoad(key)}
            draggable={false}
          />
        );
      })}

      {/* Fallback placeholder if no base character sprite */}
      {!hasBase && (
        <span className="layered-character__placeholder">🛡️</span>
      )}
    </div>
  );
}

export default LayeredCharacter;
