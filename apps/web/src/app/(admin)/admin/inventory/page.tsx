"use client";

import { useState } from "react";
import {
  Package,
  Search,
  Plus,
  MoreVertical,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Badge, Skeleton } from "@/components/ui";
import { useInventory } from "@/hooks/use-admin";

// Mock data
const inventory = [
  {
    id: "INV-001",
    name: "RO Membrane 75 GPD",
    sku: "MEM-75-001",
    category: "filters",
    stock: 45,
    minStock: 20,
    price: 850,
    status: "in_stock",
  },
  {
    id: "INV-002",
    name: "Sediment Filter",
    sku: "FLT-SED-001",
    category: "filters",
    stock: 120,
    minStock: 50,
    price: 150,
    status: "in_stock",
  },
  {
    id: "INV-003",
    name: "Carbon Filter",
    sku: "FLT-CRB-001",
    category: "filters",
    stock: 15,
    minStock: 30,
    price: 250,
    status: "low_stock",
  },
  {
    id: "INV-004",
    name: "UV Lamp",
    sku: "UV-LMP-001",
    category: "parts",
    stock: 8,
    minStock: 15,
    price: 450,
    status: "low_stock",
  },
  {
    id: "INV-005",
    name: "Storage Tank 10L",
    sku: "TNK-10L-001",
    category: "parts",
    stock: 0,
    minStock: 10,
    price: 1200,
    status: "out_of_stock",
  },
  {
    id: "INV-006",
    name: "Copper Cartridge",
    sku: "CRT-CPR-001",
    category: "addons",
    stock: 35,
    minStock: 20,
    price: 650,
    status: "in_stock",
  },
  {
    id: "INV-007",
    name: "Alkaline Filter",
    sku: "FLT-ALK-001",
    category: "addons",
    stock: 28,
    minStock: 15,
    price: 550,
    status: "in_stock",
  },
  {
    id: "INV-008",
    name: "Aqua Pro 7000 Unit",
    sku: "PUR-AP7-001",
    category: "purifiers",
    stock: 12,
    minStock: 10,
    price: 8500,
    status: "in_stock",
  },
];

const categories = [
  { id: "all", label: "All Items" },
  { id: "filters", label: "Filters" },
  { id: "parts", label: "Parts" },
  { id: "addons", label: "Add-ons" },
  { id: "purifiers", label: "Purifiers" },
];

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  in_stock: { color: "text-green-400", bg: "bg-green-500/20", label: "In Stock" },
  low_stock: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Low Stock" },
  out_of_stock: { color: "text-red-400", bg: "bg-red-500/20", label: "Out of Stock" },
};

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const inventoryQuery = useInventory({ category: categoryFilter === "all" ? undefined : categoryFilter });
  const inventoryForUi = (inventoryQuery.data?.data && inventoryQuery.data.data.length > 0
    ? inventoryQuery.data.data
    : inventory) as any[];

  const filteredInventory = inventoryForUi.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = inventoryForUi.filter((i) => i.status === "low_stock").length;
  const outOfStockCount = inventoryForUi.filter((i) => i.status === "out_of_stock").length;
  const totalValue = inventoryForUi.reduce((sum, i) => sum + i.stock * i.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-heading font-bold">Inventory</h1>
          <p className="text-body text-gray-400">
            Manage stock levels and inventory items
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium text-yellow-400">Inventory Alerts</p>
              <div className="mt-1 flex flex-wrap gap-4 text-small">
                {lowStockCount > 0 && (
                  <span className="text-yellow-300">{lowStockCount} items low on stock</span>
                )}
                {outOfStockCount > 0 && (
                  <span className="text-red-300">{outOfStockCount} items out of stock</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <p className="text-small text-gray-400">Total Items</p>
          </div>
          {inventoryQuery.isLoading ? (
            <Skeleton className="h-7 w-14 mt-2 bg-white/10" />
          ) : (
            <p className="text-h3 font-heading font-bold mt-2">{inventoryForUi.length}</p>
          )}
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <p className="text-small text-gray-400">In Stock</p>
          </div>
          <p className="text-h3 font-heading font-bold text-green-400 mt-2">
            {inventoryForUi.filter((i) => i.status === "in_stock").length}
          </p>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-yellow-400" />
            <p className="text-small text-gray-400">Low Stock</p>
          </div>
          <p className="text-h3 font-heading font-bold text-yellow-400 mt-2">{lowStockCount}</p>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-[#334155]">
          <p className="text-small text-gray-400">Total Value</p>
          <p className="text-h3 font-heading font-bold mt-2">₹{(totalValue / 100000).toFixed(1)}L</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#1E293B] rounded-lg border border-[#334155]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-small text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-2 rounded-lg text-small font-medium transition-colors ${
                categoryFilter === cat.id
                  ? "bg-primary text-white"
                  : "bg-[#1E293B] text-gray-400 hover:text-white border border-[#334155]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Item</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">SKU</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Category</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Stock</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-small font-medium text-gray-400">Unit Price</th>
                <th className="text-right py-3 px-4 text-small font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const status = statusConfig[item.status];
                return (
                  <tr key={item.id} className="border-b border-[#334155] hover:bg-[#334155]/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#334155] flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-body font-medium">{item.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-small font-mono text-gray-400">{item.sku}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-small text-gray-300 capitalize">{item.category}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className="text-body font-semibold">{item.stock}</span>
                        <span className="text-small text-gray-500 ml-1">/ min {item.minStock}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-caption font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-body">₹{item.price}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="p-2 hover:bg-[#334155] rounded-lg">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-[#334155]">
          <p className="text-small text-gray-400">
            Showing {filteredInventory.length} of {inventoryForUi.length} items
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-[#334155] text-gray-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-small text-white">1</span>
            <button className="p-2 rounded-lg bg-[#334155] text-gray-400 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
