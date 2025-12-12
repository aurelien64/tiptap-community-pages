'use client'

import React from 'react'
import { PageFormatName, PageOrientation, PAGE_FORMATS } from '@/extensions'

export interface ToolbarProps {
  format: PageFormatName
  orientation: PageOrientation
  pageCount: number
  onFormatChange: (format: PageFormatName) => void
  onOrientationChange: (orientation: PageOrientation) => void
  onInsertPageBreak?: () => void
  onPrint?: () => void
}

/**
 * Toolbar Component
 * 
 * A toolbar for controlling page format, orientation, and other page-related actions.
 */
export function Toolbar({
  format,
  orientation,
  pageCount,
  onFormatChange,
  onOrientationChange,
  onInsertPageBreak,
  onPrint,
}: ToolbarProps) {
  return (
    <div className="toolbar bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 sticky top-0 z-50">
      {/* Page Format Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="format-select" className="text-sm font-medium text-gray-700">
          Format:
        </label>
        <select
          id="format-select"
          value={format}
          onChange={(e) => onFormatChange(e.target.value as PageFormatName)}
          className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          {Object.entries(PAGE_FORMATS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.description}
            </option>
          ))}
        </select>
      </div>

      {/* Orientation Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="orientation-select" className="text-sm font-medium text-gray-700">
          Orientation:
        </label>
        <select
          id="orientation-select"
          value={orientation}
          onChange={(e) => onOrientationChange(e.target.value as PageOrientation)}
          className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Page Break Button */}
      {onInsertPageBreak && (
        <button
          onClick={onInsertPageBreak}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Insert Page Break (Ctrl+Enter)"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Page Break
        </button>
      )}

      {/* Print Button */}
      {onPrint && (
        <button
          onClick={onPrint}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Print Document"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Page Count */}
      <div className="text-sm text-gray-500">
        {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </div>
    </div>
  )
}

export default Toolbar
