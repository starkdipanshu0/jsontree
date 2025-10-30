// store/index.ts
import { configureStore } from "@reduxjs/toolkit"
import jsonReducer from "../json/slice"
import uiReducer from "../ui/slice"
export const store = configureStore({
  reducer: {
    jsonTree: jsonReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
