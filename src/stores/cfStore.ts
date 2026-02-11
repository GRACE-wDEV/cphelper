import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CFUser, CFRatingChange, CFSubmission, CFProblem, Rival, VirtualContest } from '@/types';
import {
  fetchCFUser,
  fetchCFRatingHistory,
  fetchCFSubmissions,
  extractSolvedProblems,
  analyzeWeakTags,
  recommendProblems,
  fetchCFProblems,
  fetchContestProblems,
} from '@/utils/codeforces';

interface WeakTag {
  tag: string;
  solved: number;
  attempted: number;
  ratio: number;
}

interface CFProfileState {
  // Profile
  handle: string;
  user: CFUser | null;
  ratingHistory: CFRatingChange[];
  submissions: CFSubmission[];
  solvedSet: string[]; // serialized from Set for persistence
  weakTags: WeakTag[];
  isConnected: boolean;
  isLoading: boolean;
  lastSynced: number | null;

  // Rivals
  rivals: Rival[];

  // Virtual Contest
  virtualContest: VirtualContest | null;

  // Recommendations
  recommended: CFProblem[];
  isLoadingRecs: boolean;

  // Actions
  connectHandle: (handle: string) => Promise<boolean>;
  disconnect: () => void;
  syncProfile: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;

  // Rivals
  addRival: (handle: string) => Promise<boolean>;
  removeRival: (handle: string) => void;
  syncRivals: () => Promise<void>;

  // Virtual Contest
  startVirtualContest: (contestId: number, contestName: string, durationSeconds: number) => Promise<void>;
  markVirtualSolved: (problemIndex: string) => void;
  endVirtualContest: () => void;
}

export const useCFStore = create<CFProfileState>()(
  persist(
    (set, get) => ({
      handle: '',
      user: null,
      ratingHistory: [],
      submissions: [],
      solvedSet: [],
      weakTags: [],
      isConnected: false,
      isLoading: false,
      lastSynced: null,

      rivals: [],
      virtualContest: null,
      recommended: [],
      isLoadingRecs: false,

      connectHandle: async (handle: string) => {
        set({ isLoading: true });
        const user = await fetchCFUser(handle);
        if (!user) {
          set({ isLoading: false });
          return false;
        }

        const [ratingHistory, submissions] = await Promise.all([
          fetchCFRatingHistory(handle),
          fetchCFSubmissions(handle, 1000),
        ]);

        const solvedProblems = extractSolvedProblems(submissions);
        const weakTags = analyzeWeakTags(submissions);

        set({
          handle,
          user,
          ratingHistory,
          submissions: submissions.slice(0, 200), // keep recent 200
          solvedSet: Array.from(solvedProblems),
          weakTags,
          isConnected: true,
          isLoading: false,
          lastSynced: Date.now(),
        });

        // Auto-fetch recommendations
        get().refreshRecommendations();

        return true;
      },

      disconnect: () => {
        set({
          handle: '',
          user: null,
          ratingHistory: [],
          submissions: [],
          solvedSet: [],
          weakTags: [],
          isConnected: false,
          lastSynced: null,
          recommended: [],
        });
      },

      syncProfile: async () => {
        const { handle, isConnected } = get();
        if (!isConnected || !handle) return;

        set({ isLoading: true });
        const [user, ratingHistory, submissions] = await Promise.all([
          fetchCFUser(handle),
          fetchCFRatingHistory(handle),
          fetchCFSubmissions(handle, 1000),
        ]);

        if (user) {
          const solvedProblems = extractSolvedProblems(submissions);
          const weakTags = analyzeWeakTags(submissions);

          set({
            user,
            ratingHistory,
            submissions: submissions.slice(0, 200),
            solvedSet: Array.from(solvedProblems),
            weakTags,
            isLoading: false,
            lastSynced: Date.now(),
          });
        } else {
          set({ isLoading: false });
        }

        get().refreshRecommendations();
      },

      refreshRecommendations: async () => {
        const { user, solvedSet, weakTags } = get();
        if (!user) return;

        set({ isLoadingRecs: true });
        const allProblems = await fetchCFProblems();
        const solvedSetObj = new Set(solvedSet);
        const recs = recommendProblems(allProblems, solvedSetObj, user.rating, weakTags, 20);

        set({ recommended: recs, isLoadingRecs: false });
      },

      addRival: async (handle: string) => {
        const existing = get().rivals.find((r) => r.handle.toLowerCase() === handle.toLowerCase());
        if (existing) return false;

        const user = await fetchCFUser(handle);
        if (!user) return false;

        const ratingHistory = await fetchCFRatingHistory(handle);
        const submissions = await fetchCFSubmissions(handle, 500);
        const solvedCount = extractSolvedProblems(submissions).size;

        set((state) => ({
          rivals: [
            ...state.rivals,
            { handle, user, ratingHistory, solvedCount },
          ],
        }));

        return true;
      },

      removeRival: (handle: string) => {
        set((state) => ({
          rivals: state.rivals.filter((r) => r.handle !== handle),
        }));
      },

      syncRivals: async () => {
        const { rivals } = get();
        const updated: Rival[] = [];
        for (const rival of rivals) {
          const user = await fetchCFUser(rival.handle);
          const ratingHistory = await fetchCFRatingHistory(rival.handle);
          const submissions = await fetchCFSubmissions(rival.handle, 500);
          const solvedCount = extractSolvedProblems(submissions).size;
          updated.push({
            handle: rival.handle,
            user: user || rival.user,
            ratingHistory,
            solvedCount,
          });
        }
        set({ rivals: updated });
      },

      startVirtualContest: async (contestId, contestName, durationSeconds) => {
        const problems = await fetchContestProblems(contestId);
        set({
          virtualContest: {
            contestId,
            contestName,
            problems,
            durationSeconds,
            startedAt: Date.now(),
            isRunning: true,
            solvedInVirtual: [],
          },
        });
      },

      markVirtualSolved: (problemIndex: string) => {
        set((state) => {
          if (!state.virtualContest) return state;
          return {
            virtualContest: {
              ...state.virtualContest,
              solvedInVirtual: [...new Set([...state.virtualContest.solvedInVirtual, problemIndex])],
            },
          };
        });
      },

      endVirtualContest: () => {
        set((state) => ({
          virtualContest: state.virtualContest
            ? { ...state.virtualContest, isRunning: false }
            : null,
        }));
      },
    }),
    {
      name: 'cphelper-cf-profile',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        handle: state.handle,
        user: state.user,
        ratingHistory: state.ratingHistory,
        solvedSet: state.solvedSet,
        weakTags: state.weakTags,
        isConnected: state.isConnected,
        lastSynced: state.lastSynced,
        rivals: state.rivals,
        recommended: state.recommended,
      }),
    }
  )
);
