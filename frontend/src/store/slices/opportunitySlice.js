import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  opportunities: [],
  currentOpportunity: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const opportunitySlice = createSlice({
  name: 'opportunities',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setOpportunities: (state, action) => {
      state.opportunities = action.payload.data;
      state.pagination = action.payload.pagination;
      state.loading = false;
    },
    setCurrentOpportunity: (state, action) => {
      state.currentOpportunity = action.payload;
      state.loading = false;
    },
    addOpportunity: (state, action) => {
      state.opportunities.unshift(action.payload);
    },
    updateOpportunity: (state, action) => {
      const index = state.opportunities.findIndex(
        (opp) => opp.id === action.payload.id
      );
      if (index !== -1) {
        state.opportunities[index] = action.payload;
      }
      if (state.currentOpportunity?.id === action.payload.id) {
        state.currentOpportunity = action.payload;
      }
    },
    removeOpportunity: (state, action) => {
      state.opportunities = state.opportunities.filter(
        (opp) => opp.id !== action.payload
      );
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setOpportunities,
  setCurrentOpportunity,
  addOpportunity,
  updateOpportunity,
  removeOpportunity,
  setError,
  clearError,
} = opportunitySlice.actions;

export default opportunitySlice.reducer;
