"use client";

import React, { ReactNode, useReducer } from "react";
import { SongCreationContext, initialState, songCreationReducer } from "./song-creation-context";

export function CreateSongProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(songCreationReducer, initialState);

  const clearState = () => {
    dispatch({ type: "CLEAR_STATE" });
  };

  const value = {
    state,
    dispatch,
    clearState,
  };

  return (
    <SongCreationContext.Provider value={value}>
      {children}
    </SongCreationContext.Provider>
  );
}