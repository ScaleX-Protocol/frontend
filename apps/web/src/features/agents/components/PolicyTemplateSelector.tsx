import { useState } from 'react';
import { Check } from 'lucide-react';
import { POLICY_TEMPLATES } from '../utils/policyTemplates';
import type { PolicyStruct } from '../utils/policyTemplates';

interface PolicyTemplateSelectorProps {
  onSelect: (policy: PolicyStruct) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PolicyTemplateSelector({ onSelect, onCancel, isLoading }: PolicyTemplateSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to Moderate

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl w-full max-w-lg">
        <div className="p-5 border-b border-[#1F1F1F]">
          <h2 className="text-lg font-bold text-[#FFFFFF]">Choose Policy Template</h2>
          <p className="text-sm text-[#606060] mt-1">
            Set the rules and limits for this agent
          </p>
        </div>

        <div className="p-5 space-y-3">
          {POLICY_TEMPLATES.map((template, index) => (
            <button
              key={template.name}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedIndex === index
                  ? 'border-[#F06718] bg-[#F06718]/5'
                  : 'border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#333333]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#FFFFFF]">{template.name}</h3>
                {selectedIndex === index && <Check size={16} className="text-[#F06718]" />}
              </div>
              <p className="text-xs text-[#808080] mt-1">{template.description}</p>
            </button>
          ))}
        </div>

        <div className="p-5 border-t border-[#1F1F1F] flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg border border-[#222222] text-sm text-[#E0E0E0] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSelect(POLICY_TEMPLATES[selectedIndex].policy)}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-[#F06718] text-sm text-white font-semibold hover:bg-[#D85A14] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Authorizing...' : 'Authorize Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}
