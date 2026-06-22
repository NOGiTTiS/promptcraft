import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'deepseek'

interface SettingsState {
  provider: AIProvider
  apiKey: string
  modelName: string
  setProvider: (provider: AIProvider) => void
  setApiKey: (apiKey: string) => void
  setModelName: (modelName: string) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: 'gemini',
      apiKey: '',
      modelName: 'gemini-2.5-flash',
      setProvider: (provider) => {
        let defaultModel = 'gemini-2.5-flash'
        if (provider === 'openai') defaultModel = 'gpt-4o-mini'
        if (provider === 'anthropic') defaultModel = 'claude-3-5-haiku-latest'
        if (provider === 'deepseek') defaultModel = 'deepseek-chat'
        set({ provider, modelName: defaultModel })
      },
      setApiKey: (apiKey) => set({ apiKey }),
      setModelName: (modelName) => set({ modelName }),
      resetSettings: () => set({ provider: 'gemini', apiKey: '', modelName: 'gemini-2.5-flash' }),
    }),
    {
      name: 'promptcraft-settings',
    }
  )
)
