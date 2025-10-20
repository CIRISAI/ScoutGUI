'use client';

import { useState } from 'react';
import { VERSION_INFO, getVersionString, getDetailedVersionString } from '@/lib/version';

interface VersionBadgeProps {
  className?: string;
  detailed?: boolean;
}

/**
 * Version Badge Component
 *
 * Displays application version information.
 * Click to toggle between compact and detailed view.
 *
 * @param className - Additional CSS classes
 * @param detailed - Show detailed view by default
 */
export function VersionBadge({ className = '', detailed = false }: VersionBadgeProps) {
  const [showDetailed, setShowDetailed] = useState(detailed);

  return (
    <div
      className={`text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors ${className}`}
      onClick={() => setShowDetailed(!showDetailed)}
      title="Click for more details"
    >
      {showDetailed ? getDetailedVersionString() : getVersionString()}
    </div>
  );
}

/**
 * Version Badge (Compact) - For tight spaces
 */
export function VersionBadgeCompact({ className = '' }: { className?: string }) {
  return (
    <span
      className={`text-xs text-gray-400 font-mono ${className}`}
      title={getDetailedVersionString()}
    >
      {getVersionString()}
    </span>
  );
}

/**
 * Version Info Card - For dedicated version/about pages
 */
export function VersionInfoCard() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Version Information</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Version:</dt>
          <dd className="font-mono text-gray-900">{VERSION_INFO.version}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Commit:</dt>
          <dd className="font-mono text-gray-900">{VERSION_INFO.commit}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Branch:</dt>
          <dd className="font-mono text-gray-900">{VERSION_INFO.branch}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Built:</dt>
          <dd className="font-mono text-gray-900">
            {new Date(VERSION_INFO.buildDate).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            })}
          </dd>
        </div>
      </dl>
    </div>
  );
}
