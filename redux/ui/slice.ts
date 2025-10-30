// redux/ui/uislice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store/index';

type UIState = {
  layoutDirection: 'TB' | 'LR';
  downloadImageCounter: number; // increment to request a download
  fitViewCounter: number;          // increment to request fit view
  zoomRequestId?: number;         // unique id increases each time a zoom is requested
  zoomDelta?: number;  
  searchQuery: string;
};

const initialState: UIState = {
  layoutDirection: 'TB',
  downloadImageCounter: 0,
  fitViewCounter: 0,
  zoomRequestId: 0,
  zoomDelta: 0,
  searchQuery: '',
};

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLayoutDirection(state, action: PayloadAction<'TB' | 'LR'>) {
      state.layoutDirection = action.payload;
    },
    requestDownloadImage(state) {
      // bump counter — TreeCanvas watches this
      state.downloadImageCounter = (state.downloadImageCounter || 0) + 1;
    },
    requestFitView(state) {
      state.fitViewCounter = (state.fitViewCounter || 0) + 1;
    },
    requestZoom(state, action: PayloadAction<number>) {
      state.zoomRequestId = (state.zoomRequestId || 0) + 1;
      state.zoomDelta = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
});

export const { setLayoutDirection, requestDownloadImage, requestFitView, requestZoom, setSearchQuery } = slice.actions;
export default slice.reducer;

export const selectLayoutDirection = (s: RootState) => s.ui.layoutDirection;
export const selectDownloadImageCounter = (s: RootState) => s.ui.downloadImageCounter;
export const selectFitViewCounter = (s: RootState) => s.ui.fitViewCounter;
export const selectZoomRequestId = (s: RootState) => s.ui.zoomRequestId;
export const selectZoomDelta = (s: RootState) => s.ui.zoomDelta;
export const selectSearchQuery = (s: RootState) => s.ui.searchQuery;
