import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import cosmeticsCatalogue from '../../../data/cosmeticsCatalogue';
import LayeredCharacter from '../../../components/game/LayeredCharacter';
import './Customisation.css';

const CATEGORIES = ['all', 'headgear', 'outfit', 'accessories', 'effects', 'badge', 'background', 'owned'];

const SLOT_ICONS = {
  headgear: '🎭',
  outfit: '👕',
  accessories: '💎',
  effects: '✨',
  badge: '🏅',
  background: '🖼️',
};

const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

function Customisation() {
  const { user, refreshUser } = useAuth();
  const [catalogue, setCatalogue] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmPurchase, setConfirmPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [baseIndex, setBaseIndex] = useState(0);

  const BASE_CHARACTERS = ['base_character_1', 'base_character_2'];

  const changeBase = async (newIndex) => {
    setBaseIndex(newIndex);
    const baseId = BASE_CHARACTERS[newIndex];
    try {
      await api.post('/shop/customisation', { slot: 'base', itemId: baseId });
    } catch (e) {
      console.error('Failed to save base character:', e);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [catRes, custRes] = await Promise.all([
        api.get('/shop/catalogue'),
        api.get('/shop/customisation'),
      ]);
      setCatalogue(catRes.data.catalogue);
      setBalance(catRes.data.balance);
      setEquipped(custRes.data.customisation);
      // Restore saved base character index
      const savedBase = custRes.data.customisation?.base;
      if (savedBase) {
        const idx = BASE_CHARACTERS.indexOf(savedBase);
        if (idx >= 0) setBaseIndex(idx);
      }
    } catch (err) {
      console.error('Failed to load customisation data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getItemStatus = (item) => {
    if (item.equipped) return 'equipped';
    if (item.owned) return 'owned';
    if (item.locked) return 'locked';
    if (balance < item.price) return 'expensive';
    return 'buy';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'equipped': return 'EQUIPPED';
      case 'owned': return 'OWNED';
      case 'locked': return 'LOCKED';
      case 'expensive': return 'TOO EXPENSIVE';
      case 'buy': return 'BUY';
      default: return '';
    }
  };

  const filteredItems = catalogue
    .filter(item => {
      if (activeTab === 'all') return true;
      if (activeTab === 'owned') return item.owned;
      return item.category === activeTab;
    })
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);

  const handlePurchase = async (item) => {
    setPurchasing(true);
    try {
      const { data } = await api.post('/shop/purchase', { itemId: item.id });
      if (data.success) {
        setBalance(data.balance);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 600);
        // Refresh catalogue to update ownership
        const catRes = await api.get('/shop/catalogue');
        setCatalogue(catRes.data.catalogue);
        refreshUser();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
      setConfirmPurchase(null);
      setSelectedItem(null);
    }
  };

  const handleEquip = async (item) => {
    try {
      await api.post('/shop/customisation', { slot: item.category, itemId: item.id });
      setEquipped(prev => ({ ...prev, [item.category]: item.id }));
      // Refresh catalogue for equipped status
      const catRes = await api.get('/shop/catalogue');
      setCatalogue(catRes.data.catalogue);
      setSelectedItem(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Equip failed');
    }
  };

  const handleUnequip = async (slot) => {
    try {
      await api.post('/shop/customisation', { slot, itemId: null });
      setEquipped(prev => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      const catRes = await api.get('/shop/catalogue');
      setCatalogue(catRes.data.catalogue);
      setSelectedItem(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Unequip failed');
    }
  };

  const getItemById = (id) => cosmeticsCatalogue.find(i => i.id === id);

  /**
   * Build the LayeredCharacter config from the equipped state.
   * The equipped object uses category keys (headgear, outfit, etc.) with item_id values.
   * We map 'effects' → effects_front for the layered renderer.
   */
  const buildCharacterConfig = () => {
    return {
      base_character: BASE_CHARACTERS[baseIndex],
      headgear: equipped.headgear || null,
      outfit: equipped.outfit || null,
      accessories: equipped.accessories || null,
      effects_back: null,
      effects_front: equipped.effects || null,
      badge: equipped.badge || null,
      background: equipped.background || null,
    };
  };

  if (loading) {
    return <div className="customisation-loading">Loading customisation data...</div>;
  }

  return (
    <div className="customisation-page">
      <h1>Character Customisation</h1>

      {showFlash && <div className="purchase-flash" />}

      <div className="customisation-layout">
        {/* LEFT: Character Preview */}
        <div className="customisation-preview">
          <div className="preview-character-container">
            <button className="base-arrow base-arrow--left" onClick={() => changeBase((baseIndex - 1 + BASE_CHARACTERS.length) % BASE_CHARACTERS.length)}>◀</button>
            <LayeredCharacter
              config={buildCharacterConfig()}
              size="lg"
              animated={true}
              previewItem={hoveredItem}
            />
            <button className="base-arrow base-arrow--right" onClick={() => changeBase((baseIndex + 1) % BASE_CHARACTERS.length)}>▶</button>
          </div>
          <span className="base-label">Character {baseIndex + 1} / {BASE_CHARACTERS.length}</span>
          <span className="preview-username">{user?.username || 'Sentinel'}</span>
          <span className="preview-tier">{user?.tier || 'Recruit'}</span>
          <div className="preview-balance">
            <span className="preview-balance-label">Awareness</span>
            <span className="preview-balance-value">{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* RIGHT: Catalogue */}
        <div className="customisation-catalogue">
          <div className="catalogue-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`catalogue-tab ${activeTab === cat ? 'active' : ''}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="catalogue-grid">
            {filteredItems.map(item => {
              const status = getItemStatus(item);
              return (
                <div
                  key={item.id}
                  className={`catalogue-card ${status}`}
                  onClick={() => setSelectedItem(item)}
                  onMouseEnter={() => setHoveredItem({ id: item.id, category: item.category })}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={`card-icon ${item.rarity}`}>
                    <img
                      className="card-sprite"
                      src={item.imagePath || `/sprites/customisation/headgear/${item.id}.png`}
                      alt={item.name}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="card-icon-fallback">{SLOT_ICONS[item.category] || '📦'}</span>
                  </div>
                  <span className="card-name">{item.name}</span>
                  <span className={`card-rarity ${item.rarity}`}>{item.rarity}</span>
                  <span className="card-price">⚡ {item.price}</span>
                  <span className={`card-status ${status}`}>{getStatusLabel(status)}</span>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              No items in this category.
            </p>
          )}
        </div>
      </div>

      {/* BOTTOM: Equipped Slots */}
      <div className="equipped-strip">
        {Object.keys(SLOT_ICONS).map(slot => {
          const equippedItemId = equipped[slot];
          const equippedItem = equippedItemId ? getItemById(equippedItemId) : null;
          return (
            <div key={slot} className="equipped-slot">
              <div className={`equipped-slot-icon ${equippedItem ? 'filled' : ''}`}>
                {equippedItem ? (
                  <img
                    className="equipped-slot-sprite"
                    src={equippedItem.imagePath}
                    alt={equippedItem.name}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span>—</span>
                )}
              </div>
              <span className="equipped-slot-label">{slot}</span>
              {equippedItem && <span className="equipped-slot-name">{equippedItem.name}</span>}
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && !confirmPurchase && (
        <div className="customisation-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="customisation-modal" onClick={e => e.stopPropagation()}>
            <div className={`modal-icon ${selectedItem.rarity}`}>
              <img
                className="modal-sprite"
                src={selectedItem.imagePath}
                alt={selectedItem.name}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="modal-icon-fallback">{SLOT_ICONS[selectedItem.category] || '📦'}</span>
            </div>
            <span className="modal-name">{selectedItem.name}</span>
            <span className={`card-rarity ${selectedItem.rarity}`}>{selectedItem.rarity}</span>
            <p className="modal-description">{selectedItem.description}</p>
            <div className="modal-meta">
              <span className="modal-price">⚡ {selectedItem.price}</span>
              <span className={`card-status ${getItemStatus(selectedItem)}`}>
                {getStatusLabel(getItemStatus(selectedItem))}
              </span>
            </div>
            {selectedItem.unlockRequirement && selectedItem.locked && (
              <p style={{ color: 'var(--color-red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                🔒 Requires: {selectedItem.unlockRequirement.type === 'mission'
                  ? `Complete ${selectedItem.unlockRequirement.id.replace('_', ' ')}`
                  : `Reach ${selectedItem.unlockRequirement.tier} tier`}
              </p>
            )}
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setSelectedItem(null)}>
                Close
              </button>
              {getItemStatus(selectedItem) === 'buy' && (
                <button className="modal-btn primary" onClick={() => setConfirmPurchase(selectedItem)}>
                  Purchase
                </button>
              )}
              {getItemStatus(selectedItem) === 'owned' && (
                <button className="modal-btn equip" onClick={() => handleEquip(selectedItem)}>
                  Equip
                </button>
              )}
              {getItemStatus(selectedItem) === 'equipped' && (
                <button className="modal-btn unequip" onClick={() => handleUnequip(selectedItem.category)}>
                  Unequip
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PURCHASE MODAL */}
      {confirmPurchase && (
        <div className="customisation-modal-overlay" onClick={() => setConfirmPurchase(null)}>
          <div className="customisation-modal confirm-modal" onClick={e => e.stopPropagation()}>
            <span className="modal-name">Confirm Purchase</span>
            <p>
              Buy <strong>{confirmPurchase.name}</strong>?
              <span className="confirm-price">⚡ {confirmPurchase.price}</span>
              Balance after: ⚡ {(balance - confirmPurchase.price).toLocaleString()}
            </p>
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setConfirmPurchase(null)} disabled={purchasing}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={() => handlePurchase(confirmPurchase)} disabled={purchasing}>
                {purchasing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customisation;
