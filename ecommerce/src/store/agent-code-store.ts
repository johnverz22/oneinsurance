import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AgentCodeStore {
  agentCode: string | null
  setAgentCode: (code: string) => void
  clearAgentCode: () => void
}

export const useAgentCodeStore = create<AgentCodeStore>()(
  persist(
    (set) => ({
      agentCode: null,
      setAgentCode: (code: string) => set({ agentCode: code }),
      clearAgentCode: () => set({ agentCode: null }),
    }),
    {
      name: 'agent-code-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
