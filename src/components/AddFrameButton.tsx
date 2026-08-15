// AddFrameButton.tsx
import { useMiniApp } from '@neynar/react';
import { Plus } from 'lucide-react';

export default function AddFrameButton() {
  const { isSDKLoaded, added, actions } = useMiniApp();

  if (!isSDKLoaded || added) return null;

  const handleAddFrame = async () => {
    try {
      await actions.addMiniApp();
    } catch (err) {
      console.error('addMiniApp error', err);
    }
  };

  return (
    <div className="flex items-center justify-end mb-3">
      <button
        onClick={handleAddFrame}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-indigo-400 bg-indigo-950/60 text-xs font-semibold text-indigo-200 hover:bg-indigo-800 hover:text-white transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        style={{ minHeight: 0, minWidth: 0 }}
      >
        <Plus size={14} className="-ml-0.5" />
        Add mini app
      </button>
    </div>
  );
}
