import { useState } from "react";
import { Bot, ExternalLink, Code, FileText, Copy, Check, Terminal } from "lucide-react";
import ModalWrapper from "@/components/modals/modalWrapper";

interface RegisterAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterAgentModal({
  isOpen,
  onClose,
}: RegisterAgentModalProps) {
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedRepo, setCopiedRepo] = useState(false);
  const [copiedSkill, setCopiedSkill] = useState(false);

  const cliRepoUrl = "https://github.com/ScaleX-Protocol/cli";
  const exampleRepoUrl = "https://github.com/AnomalyFi/scalex-agent";
  const skillsDocUrl =
    "https://github.com/AnomalyFi/scalex-agent/blob/main/SKILL.md";

  const handleCopy = async (text: string, type: "cli" | "repo" | "skill") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "cli") {
        setCopiedCli(true);
        setTimeout(() => setCopiedCli(false), 2000);
      } else if (type === "repo") {
        setCopiedRepo(true);
        setTimeout(() => setCopiedRepo(false), 2000);
      } else {
        setCopiedSkill(true);
        setTimeout(() => setCopiedSkill(false), 2000);
      }
    } catch {
      // clipboard unavailable — fail silently
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Register an Agent"
      icon={Bot}
      maxWidth="max-w-5xl"
    >
      <div className="p-6 space-y-6">
        {/* Introduction */}
        <p className="text-[#A0A0A0] text-sm leading-relaxed">
          Want to build and register your own AI trading agent on ScaleX? Choose
          a starting point below.
        </p>

        {/* 3-Column Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: ScaleX CLI */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-4 space-y-3 flex flex-col">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#22C55E]/10 rounded-lg">
                <Terminal className="w-4 h-4 text-[#22C55E]" />
              </div>
              <h3 className="text-[#E0E0E0] font-medium">ScaleX CLI</h3>
            </div>
            <p className="text-[#808080] text-sm flex-1">
              The official CLI for ScaleX. Query market data, place orders, and
              run your agent as an MCP server for AI integrations.
            </p>
            <pre className="bg-[#0A0A0A] rounded-lg p-3 text-xs text-[#A0A0A0] font-mono overflow-x-auto leading-relaxed">
              {`git clone https://github.com/ScaleX-Protocol/cli
cd cli && bun install
bun run src/index.ts --help`}
            </pre>
            <div className="flex items-center gap-2">
              <a
                href={cliRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-lg text-sm font-medium text-[#E0E0E0] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View CLI Repo
              </a>
              <button
                type="button"
                aria-label="Copy CLI repo URL"
                onClick={() => handleCopy(cliRepoUrl, "cli")}
                className="p-2.5 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-lg text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
              >
                {copiedCli ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Example Implementation */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-4 space-y-3 flex flex-col">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#F06718]/10 rounded-lg">
                <Code className="w-4 h-4 text-[#F06718]" />
              </div>
              <h3 className="text-[#E0E0E0] font-medium">
                Example Implementation
              </h3>
            </div>
            <p className="text-[#808080] text-sm flex-1">
              Clone our reference implementation to see a fully working agent
              with MCP tools, A2A protocol support, and trading capabilities.
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <a
                href={exampleRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-lg text-sm font-medium text-[#E0E0E0] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Repository
              </a>
              <button
                type="button"
                aria-label="Copy example repo URL"
                onClick={() => handleCopy(exampleRepoUrl, "repo")}
                className="p-2.5 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-lg text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
              >
                {copiedRepo ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Build Your Own */}
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-4 space-y-3 flex flex-col">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#3B82F6]/10 rounded-lg">
                <FileText className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <h3 className="text-[#E0E0E0] font-medium">Build Your Own</h3>
            </div>
            <p className="text-[#808080] text-sm flex-1">
              Prefer to code from scratch? Our SKILL.md documentation provides
              all the context, MCP tools, and API references you need.
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <a
                href={skillsDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-lg text-sm font-medium text-[#E0E0E0] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View SKILL.md
              </a>
              <button
                type="button"
                aria-label="Copy docs URL"
                onClick={() => handleCopy(skillsDocUrl, "skill")}
                className="p-2.5 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-lg text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
              >
                {copiedSkill ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-2">
          <h4 className="text-[#808080] text-xs uppercase tracking-wider">
            What you can build
          </h4>
          <ul className="space-y-1.5 text-sm text-[#A0A0A0]">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#F06718] rounded-full" />
              Automated trading strategies (DCA, Grid, Momentum)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#F06718] rounded-full" />
              Portfolio management with user-defined policies
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#F06718] rounded-full" />
              Risk management and lending automation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#F06718] rounded-full" />
              ERC-8004 compliant agent identity
            </li>
          </ul>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-[#F06718] hover:bg-[#D85A15] rounded-xl text-white font-medium transition-colors"
        >
          Got it
        </button>
      </div>
    </ModalWrapper>
  );
}
