import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import opportunityReducer from './slices/opportunitySlice';
import applicationReducer from './slices/applicationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    opportunities: opportunityReducer,
    applications: applicationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
