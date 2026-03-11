'use client';

import { useState } from 'react';
import { UserRole, AppSettings } from '@/lib/types';
import { getSheetUrl, setSheetUrl, clearSheetUrl, syncAllNotesToSheet } from '@/lib/sheets';
import { getAllNotes, getAppSettings, updateAppSettings } from '@/lib/store';
import { testApiKey } from '@/lib/ai';

interface SettingsViewProps {
  role: UserRole;
  showToast: (msg: string) => void;
  sheetConnected: boolean;
  setSheetConnected: (v: boolean) => void;
}

export default function SettingsView({ role, showToast, sheetConnected, setSheetConnected }: SettingsViewProps) {
  const [sheetUrl, setSheetUrlState] = useState<string>(getSheetUrl() || '');
  const [syncing, setSyncing] = useState(false);

  const settings = getAppSettings();
  const [aiApiKey, setAiApiKey] = useState(settings.aiApiKey || '');
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');

  return (
    <div className="max-w-lg mx-auto space-y-6 fade-in">
      {/* Google Sheets Integration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
          Google Sheets Integration
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Connect a Google Sheet to automatically sync daily notes.
        </p>

        {sheetConnected ? (
          <div className="space-y-4">
            <div className="bg-gm-success-light border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gm-success shrink-0">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gm-success font-medium">Google Sheet connected</p>
            </div>

            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Sheet URL</p>
              <p className="text-xs text-gray-600 break-all font-mono">{sheetUrl}</p>
            </div>

            <button
              onClick={async () => {
                setSyncing(true);
                const notes = getAllNotes();
                const phiEnabled = getAppSettings().phiProtectionEnabled;
                const result = await syncAllNotesToSheet(notes, { maskClientName: phiEnabled });
                setSyncing(false);
                if (result.success) {
                  showToast(`Synced ${notes.length} notes to Google Sheet!`);
                } else {
                  showToast(result.error || 'Sync failed');
                }
              }}
              disabled={syncing}
              className="w-full bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {syncing ? 'Syncing...' : 'Sync All Notes Now'}
            </button>

            <button
              onClick={() => {
                clearSheetUrl();
                setSheetUrlState('');
                setSheetConnected(false);
                showToast('Google Sheet disconnected');
              }}
              className="w-full text-gm-red hover:bg-gm-red-light text-sm py-2 rounded-lg transition-colors"
            >
              Disconnect Sheet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              <p className="font-medium mb-1">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Create a new Google Sheet</li>
                <li>Go to Extensions &gt; Apps Script</li>
                <li>Paste the script from <code className="bg-amber-100 px-1 rounded">google-apps-script.js</code></li>
                <li>Run the <code className="bg-amber-100 px-1 rounded">setupSheet</code> function once</li>
                <li>Click Deploy &gt; New deployment &gt; Web app</li>
                <li>Set &quot;Who has access&quot; to &quot;Anyone&quot;</li>
                <li>Copy the deployment URL and paste it below</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Apps Script Web App URL</label>
              <input
                type="url"
                value={sheetUrl}
                onChange={e => setSheetUrlState(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={() => {
                if (!sheetUrl.trim() || !sheetUrl.includes('script.google.com')) {
                  showToast('Please enter a valid Apps Script URL');
                  return;
                }
                setSheetUrl(sheetUrl.trim());
                setSheetConnected(true);
                showToast('Google Sheet connected!');
              }}
              disabled={!sheetUrl.trim()}
              className="w-full bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Connect Google Sheet
            </button>
          </div>
        )}
      </div>

      {/* AI Note Enhancement */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
          AI Note Enhancement
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Improve spelling, grammar, and professional clarity of daily notes using AI.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">OpenAI API Key</label>
            <input
              type="password"
              value={aiApiKey}
              onChange={e => { setAiApiKey(e.target.value); setKeyStatus('untested'); }}
              placeholder="sk-..."
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-gm-gold focus:outline-none transition-colors font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!aiApiKey.trim()) { showToast('Please enter an API key'); return; }
                setTestingKey(true);
                const result = await testApiKey(aiApiKey.trim());
                setTestingKey(false);
                if (result.valid) {
                  setKeyStatus('valid');
                  showToast('API key is valid!');
                } else {
                  setKeyStatus('invalid');
                  showToast(result.error || 'Invalid API key');
                }
              }}
              disabled={!aiApiKey.trim() || testingKey}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {testingKey ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={() => {
                if (!aiApiKey.trim()) { showToast('Please enter an API key'); return; }
                updateAppSettings({ aiApiKey: aiApiKey.trim(), aiProvider: 'openai' });
                showToast('AI API key saved!');
              }}
              disabled={!aiApiKey.trim()}
              className="flex-1 bg-gm-green hover:bg-gm-green-light disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Save Key
            </button>
          </div>

          {keyStatus !== 'untested' && (
            <div className={`flex items-center gap-2 text-sm ${keyStatus === 'valid' ? 'text-gm-success' : 'text-gm-red'}`}>
              {keyStatus === 'valid' ? '✓ Connected' : '✗ Invalid key'}
            </div>
          )}

          {settings.aiApiKey && (
            <button
              onClick={() => {
                updateAppSettings({ aiApiKey: '', aiProvider: 'none' });
                setAiApiKey('');
                setKeyStatus('untested');
                showToast('AI disconnected');
              }}
              className="w-full text-gm-red hover:bg-gm-red-light text-sm py-2 rounded-lg transition-colors"
            >
              Remove API Key
            </button>
          )}

          <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500">
            <p className="font-medium text-gray-600 mb-1">How it works:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Uses GPT-4o-mini for cost-effective grammar improvements</li>
              <li>Fixes spelling, punctuation, and professional clarity</li>
              <li>Never changes the meaning of your notes</li>
              <li>Your API key is stored locally on this device only</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PHI Protection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gm-green-dark mb-2" style={{ fontFamily: 'var(--font-graduate), Graduate, cursive' }}>
          PHI Protection
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          When enabled, providers see client codes (e.g., JC-001) instead of full names. Admins always see full names.
        </p>

        {role === 'admin' ? (
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">PHI Protection Mode</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.phiProtectionEnabled}
                  onChange={e => {
                    updateAppSettings({ phiProtectionEnabled: e.target.checked });
                    showToast(e.target.checked ? 'PHI Protection enabled' : 'PHI Protection disabled');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-gm-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gm-green" />
              </div>
            </label>
            <div className={`px-4 py-3 rounded-lg text-sm ${settings.phiProtectionEnabled ? 'bg-gm-success-light text-gm-success' : 'bg-gray-50 text-gray-500'}`}>
              {settings.phiProtectionEnabled
                ? 'Providers see coded identifiers (e.g., JC-001)'
                : 'Providers see full client names'
              }
            </div>
          </div>
        ) : (
          <div className={`px-4 py-3 rounded-lg text-sm ${settings.phiProtectionEnabled ? 'bg-gm-success-light text-gm-success' : 'bg-gray-50 text-gray-500'}`}>
            {settings.phiProtectionEnabled
              ? '✓ PHI Protection is enabled — client names are masked'
              : 'PHI Protection is disabled. Contact your admin to enable it.'
            }
          </div>
        )}
      </div>
    </div>
  );
}
