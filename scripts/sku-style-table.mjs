// scripts/sku-style-table.mjs — 每个商品链接的英文款式名与基材依据
// 款式名由中文标题人工译出；baseMaterialBasis 只在标题明示时填写，
// 未明示者 line 为 null（按「不编造」原则扣住，等客户确认基材）。
// index 为 inventory-1688.json products 数组的全局下标。

export const STYLES = {
  // ---- 骏娅（全局 0-36）----
  0:  { style: 'Geometric Zircon Pendant Necklace', base: null },
  1:  { style: 'Gold Bar Pendant Necklace', base: '钛钢' },
  2:  { style: 'White Zircon Square Pendant Necklace', base: '不锈钢' },
  3:  { style: 'Zircon Leaf Pendant Necklace', base: '不锈钢' },
  4:  { style: 'Heart Zircon Link Bracelet', base: '不锈钢' },
  5:  { style: 'Butterfly Tassel Pendant Necklace', base: '钛钢' },
  6:  { style: 'Five Clover Bracelet', base: '钛钢' },
  7:  { style: 'Minimal Beach Anklet', base: '钛钢' },
  8:  { style: 'Letter Drop Pendant Necklace', base: '钛钢' },
  9:  { style: 'Shell Bean Pendant Necklace', base: null },
  10: { style: 'Beaded Butterfly Tassel Earrings', base: '钛钢' },
  11: { style: 'Open Heart Pendant Necklace', base: '不锈钢' },
  12: { style: 'Open Clover Ring', base: '不锈钢' },
  13: { style: 'Six Flower Paved Bracelet', base: '不锈钢' },
  14: { style: 'Open Ring and Bar Letter Pendant Necklace', base: '钛钢' },
  15: { style: 'Colour Zircon Tennis Bracelet', base: null },
  16: { style: 'Chunky Chain Bracelet', base: '钛钢' },
  17: { style: 'Two Face Clover Pendant Necklace', base: '钛钢' },
  18: { style: 'Shell Butterfly Pendant Necklace', base: '不锈钢' },
  19: { style: 'Colour Zircon Link Bracelet', base: null },
  20: { style: 'Six Stone Disc Pendant Necklace', base: '钛钢' },
  21: { style: 'Clover and Shell Cuff', base: '钛钢' },
  22: { style: 'Beaded Y Necklace', base: '不锈钢' },
  23: { style: 'Roman Numeral Coin Pendant Necklace', base: '钛钢' },
  24: { style: 'Five Clover Bracelet', base: '钛钢' },
  25: { style: 'Textured Clover Stud Earrings', base: '钛钢' },
  26: { style: 'Thirteen Millimetre Clover Set', base: '钛钢' },
  27: { style: 'Turquoise Square Blade Chain Necklace', base: '钛钢' },
  28: { style: 'Paved Chain Necklace', base: '钛钢' },
  29: { style: 'Black Round Pendant Necklace', base: '钛钢' },
  30: { style: 'Black Ceramic Bead Necklace', base: '钛钢' },
  31: { style: 'Liquid Geometric Drop Earrings', base: null },
  32: { style: 'Zircon Link Bracelet', base: '钛钢' },
  33: { style: 'Paved Clover Earrings', base: '不锈钢' },
  34: { style: 'Heart Zircon Tennis Necklace', base: '不锈钢' },
  35: { style: 'Pave Clover Pendant Necklace', base: '钛钢' },
  36: { style: 'Square Plate Snake Chain Necklace', base: '钛钢' },

  // ---- 义乌市空屿（全局 37-51）----
  37: { style: 'Fishtail Tassel Drop Earrings', base: null },
  38: { style: 'Tassel Teardrop Chain Earrings', base: null },
  39: { style: 'Pearl Drop Earrings', base: null },
  40: { style: 'Halloween Charm Stud Earrings', base: null },
  41: { style: 'Miao Silver Tassel Earrings', base: null },
  42: { style: 'Wave Motif Jewelry Set', base: null },
  43: { style: 'Punk Skull Stud Earrings', base: '合金' },
  44: { style: 'Bamboo Segment Hoop Earrings', base: null },
  45: { style: 'Christmas Motif Drop Earrings', base: null },
  46: { style: 'Leopard Print Disc Earrings', base: null },
  47: { style: 'Maillard Crescent Stud Earrings', base: null },
  48: { style: 'Flower Pendant Jewelry Set', base: '合金' },
  49: { style: 'Pearl Hoop Earrings', base: null },
  50: { style: 'Zircon Hoop Earrings', base: 'S925银针' },
  51: { style: 'Butterfly Tassel Drop Earrings', base: 'S925银针' },
};

/** 基材 → 站点产品线。S925 银不在现有三条线内，属分类体系缺口，返回 null 并另行标记。 */
export function lineFor(base) {
  if (!base) return null;
  if (/不锈钢|钛钢/.test(base)) return 'stainless-titanium-steel';
  if (/合金/.test(base)) return 'fashion-alloy-brass';
  if (/天然石|珍珠|贝/.test(base)) return 'natural-stone-gemstone-pearl';
  return null; // S925 银等：现有三线无法容纳
}

/**
 * 基材的英文写法。**必须经此函数转换**——中文基材若直接进入 short_description
 * 会把汉字带进英文站产物（构建后扫描发现 34 页命中）。
 */
export function baseEn(base) {
  if (!base) return null;
  if (/不锈钢/.test(base)) return 'stainless steel';
  if (/钛钢/.test(base)) return 'titanium steel';
  if (/合金/.test(base)) return 'alloy';
  if (/S925|925银/.test(base)) return 'S925 silver';
  return null; // 未登记的中文基材一律不外发，避免汉字外泄
}
