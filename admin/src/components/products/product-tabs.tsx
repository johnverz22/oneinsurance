'use client'

import React, { useState } from 'react'
import { Search, Filter, Plus } from 'lucide-react'
import ProductsMainContent from './products-main-content'
import AgentsMainContent from './agents-main-content'
import AssignProductDialog from './assign-product-dialog'

export default function ProductTabs() {
  const [activeTab, setActiveTab] = useState('products')

  return (
    <div className="mt-4 min-h-screen">
      <div>
        {/* Top Navigation & Actions Bar */}
        <div className="mb-0 flex flex-col-reverse justify-between gap-4 md:flex-row md:items-end md:gap-0">
          {/* Tabs */}
          <div className="flex items-end space-x-[-8px]">
            <button
              onClick={() => setActiveTab('products')}
              className={`relative z-20 rounded-t-2xl px-8 py-3 text-lg font-bold transition-all ${
                activeTab === 'products'
                  ? 'shadow-sm'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700'
              }`}
            >
              Products
              {activeTab === 'products' && (
                <div className="absolute bottom-[-10px] left-0 z-30 h-[10px] w-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              className={`relative z-10 rounded-t-2xl px-8 py-3 text-lg font-bold transition-all ${
                activeTab === 'agents'
                  ? 'shadow-sm'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700'
              }`}
            >
              Agents
            </button>
          </div>

          {/* Search & Action Button */}
          <div className="mb-2 flex flex-1 flex-col items-center gap-4 sm:flex-row md:mb-3 md:justify-end">
            <div className="relative w-full sm:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full rounded-full border border-gray-300 bg-white py-2.5 pr-10 pl-10 leading-5 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 hover:text-gray-600">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <AssignProductDialog />
          </div>
        </div>

        {activeTab === 'products' ? (
          <ProductsMainContent />
        ) : (
          <AgentsMainContent />
        )}
      </div>
    </div>
  )
}
