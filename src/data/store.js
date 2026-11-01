// src/data/store.js
// ─────────────────────────────────────────────────────────────
// Data + lightweight "API layer" for the /store page.
//
// Same shape as data/votes.js: every fetchX() returns a Promise and
// resolves from local mock data after a short simulated delay. Swap the
// body for a real `fetch("/api/...")` call whenever the backend exists —
// no component needs to change.
//
// Suggested real endpoints, for whenever the backend is ready:
//   GET /api/store/stats
//   GET /api/store/monthly-goal
//   GET /api/store/ranks
//   GET /api/store/crate-keys
//   GET /api/store/currency-packs
//   GET /api/store/top-donators?period=monthly|allTime
// ─────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase";

const SIMULATED_DELAY = 250; // ms — mimics a network round-trip

function resolve(data) {
  return new Promise((res) => setTimeout(() => res(data), SIMULATED_DELAY));
}

// Ranks / Crate Keys / Currency Packs are managed via /admin/store and
// live in the `store_content` table (one row per category, `data` is the
// full JSON array). Falls back to the local static array if the row
// doesn't exist yet or the request fails, so the page never breaks.
async function fetchStoreContent(key, fallback) {
  const { data, error } = await supabase
    .from("store_content")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return data.data;
}

// Next 1st-of-month at local midnight — used as the monthly goal reset.
function getMonthResetAt() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ── Overview stats ────────────────────────────────────────────
export function fetchStoreStats() {
  return resolve({
    totalRaised: 128400,
    totalDonators: 612,
  });
}

// ── Monthly hosting goal ─────────────────────────────────────
export function fetchMonthlyGoal() {
  return resolve({
    current: 3420,
    target: 6000,
    currency: "৳",
    supporters: 47,
    endsAt: getMonthResetAt(),
  });
}

// ── Ranks ─────────────────────────────────────────────────────
// Single source of truth for rank pricing/perks — used by both the
// standalone /ranks page (short highlight list) and the "Ranks" tab on
// /store (full side-by-side perk comparison).

// Rows shown in the Store comparison table, top to bottom. `type` controls
// how RanksTab renders the cell for each rank:
//   "check"  -> green check / greyed dash
//   "number" -> the value itself (or a greyed dash when falsy/0)
export const RANK_PERK_ROWS = [
  { key: "chatIcon", label: "Special Chat Icon", type: "check" },
  { key: "priorityQueue", label: "Priority Queue", type: "check" },
  { key: "exclusiveKits", label: "Access to Exclusive Kits", type: "check" },
  { key: "remoteWarpAccess", label: "Remote Access to Player Warps", type: "check" },
  { key: "bulkSellAccess", label: "Bulk Sell & Auto-Sell Access", type: "check" },
  { key: "disguiseAccess", label: "Access to Disguises", type: "check" },
  { key: "rankColorChanger", label: "Nickname & Rank Color Changer", type: "check" },
  { key: "joinAnnouncement", label: "Server-wide Join Announcement", type: "check" },
  { key: "webstoreDiscount", label: "Discount on Future Webstore Purchases", type: "number", suffix: "%" },
  { key: "bonusVotePoints", label: "Bonus Vote Points (per vote)", type: "number" },
  { key: "bonusCrateKeys", label: "Bonus Crate Keys (monthly)", type: "number" },
  { key: "bonusHomes", label: "Bonus Home Locations", type: "number" },
  { key: "bonusWarps", label: "Bonus Player Warps", type: "number" },
  { key: "bonusQuestRerolls", label: "Bonus Daily Quest Rerolls", type: "number" },
  { key: "bonusWeeklyQuests", label: "Bonus Weekly Quests", type: "number" },
];

export const RANKS = [
  {
    key: "vip",
    name: "VIP",
    price: "$4.99",
    tone: "",
    usernameColor: "Green",
    perks: ["Colored name tag", "/hat and /kit vip", "2 extra homes"],
    values: {
      chatIcon: true,
      priorityQueue: true,
      exclusiveKits: true,
      remoteWarpAccess: false,
      bulkSellAccess: false,
      disguiseAccess: false,
      rankColorChanger: false,
      joinAnnouncement: false,
      webstoreDiscount: 0,
      bonusVotePoints: 1,
      bonusCrateKeys: 1,
      bonusHomes: 2,
      bonusWarps: 0,
      bonusQuestRerolls: 0,
      bonusWeeklyQuests: 1,
    },
  },
  {
    key: "mvp",
    name: "MVP",
    price: "$9.99",
    tone: "primary",
    usernameColor: "Aqua",
    perks: [
      "Everything in VIP",
      "/fly in the lobby",
      "5 extra homes",
      "Priority queue",
    ],
    featured: true,
    values: {
      chatIcon: true,
      priorityQueue: true,
      exclusiveKits: true,
      remoteWarpAccess: true,
      bulkSellAccess: true,
      disguiseAccess: true,
      rankColorChanger: false,
      joinAnnouncement: false,
      webstoreDiscount: 10,
      bonusVotePoints: 2,
      bonusCrateKeys: 3,
      bonusHomes: 5,
      bonusWarps: 2,
      bonusQuestRerolls: 1,
      bonusWeeklyQuests: 2,
    },
  },
  {
    key: "legend",
    name: "LEGEND",
    price: "$19.99",
    tone: "success",
    usernameColor: "Gold",
    perks: [
      "Everything in MVP",
      "Exclusive cosmetic set",
      "Unlimited homes",
      "Early access to new features",
    ],
    values: {
      chatIcon: true,
      priorityQueue: true,
      exclusiveKits: true,
      remoteWarpAccess: true,
      bulkSellAccess: true,
      disguiseAccess: true,
      rankColorChanger: true,
      joinAnnouncement: true,
      webstoreDiscount: 20,
      bonusVotePoints: 3,
      bonusCrateKeys: 6,
      bonusHomes: "Unlimited",
      bonusWarps: 5,
      bonusQuestRerolls: 3,
      bonusWeeklyQuests: 3,
    },
  },
];

export function fetchRanks() {
  return fetchStoreContent("ranks", RANKS);
}

// ── Crates & Keys ─────────────────────────────────────────────
export const CRATE_KEYS = [
  {
    key: "common",
    name: "Common Key",
    price: "$2.99",
    tone: "neutral",
    contents: ["Basic cosmetics", "Small currency boost", "Common tools"],
  },
  {
    key: "rare",
    name: "Rare Key",
    price: "$6.99",
    tone: "info",
    contents: ["Rare cosmetics", "Mid-tier currency", "Enchanted gear"],
  },
  {
    key: "epic",
    name: "Epic Key",
    price: "$12.99",
    tone: "primary",
    contents: ["Epic cosmetics", "Large currency boost", "Exclusive pets"],
    featured: true,
  },
  {
    key: "legendary",
    name: "Legendary Key",
    price: "$24.99",
    tone: "pink",
    contents: ["Legendary cosmetics", "Max currency boost", "One-of-a-kind items"],
  },
];

export function fetchCrateKeys() {
  return fetchStoreContent("crate_keys", CRATE_KEYS);
}

// ── Currency packs ─────────────────────────────────────────────
export const CURRENCY_PACKS = [
  { key: "starter", name: "Starter Pack", amount: "10,000 Coins", price: "$3.99", tone: "neutral" },
  {
    key: "value",
    name: "Value Pack",
    amount: "30,000 Coins",
    price: "$8.99",
    tone: "info",
    bonus: "+15% bonus",
    featured: true,
  },
  { key: "mega", name: "Mega Pack", amount: "75,000 Coins", price: "$18.99", tone: "primary", bonus: "+25% bonus" },
  {
    key: "ultimate",
    name: "Ultimate Pack",
    amount: "200,000 Coins",
    price: "$39.99",
    tone: "pink",
    bonus: "+40% bonus",
  },
];

export function fetchCurrencyPacks() {
  return fetchStoreContent("currency_packs", CURRENCY_PACKS);
}

// ── Top donators ─────────────────────────────────────────────
// Dihitung server dari order PAID (lihat api/top-donators.js).
// `amount` dalam Rupiah; `tier` = rank termahal yang pernah dibeli player.
export async function fetchTopDonators(period = "monthly") {
  try {
    const res = await fetch(`/api/top-donators?period=${period === "allTime" ? "allTime" : "monthly"}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.donators ?? [];
  } catch {
    return [];
  }
}
